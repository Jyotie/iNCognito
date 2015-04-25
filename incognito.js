//set global variables
const secretKey = 45;
const setcookie = "SET-COOKIE";
const justcookie = "COOKIE";
const mySeparator = "[0A:z";
const defaultCookieSeparator = ";";
var counter = 0;
var focusTab = new Array();
var cookieCache = new Array();
var lastActiveTab;

//find when a tab is created
chrome.tabs.onCreated.addListener(function (newTab){
    console.log("------created:" + newTab.Id + "->" + newTab.url);
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabObjectsA) {
        for(var countA=0; countA<tabObjectsA.length; countA++) {
            focusTab[countA] = tabObjectsA[countA];
        }
        for (var countB=0; countB<focusTab.length; countB++){
            if(focusTab[countB]!=null) {
                lastActiveTab = focusTab[countB].id;
                var badgecontentsA = {text: "" + focusTab[countB].id};
                chrome.browserAction.setBadgeText(badgecontentsA);
            }
        }
    });
});

//find when a tab is updated
chrome.tabs.onUpdated.addListener(function (tabint, changeinfo, updTab){
    console.log("------updated:" + tabint + "->" + changeinfo.url);
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabObjectsB) {
        for(var countC=0; countC<tabObjectsB.length; countC++) {
            focusTab[countC] = tabObjectsB[countC];
        }
        for (var countD=0; countD<focusTab.length; countD++){
            if(focusTab[countD]!=null) {
                lastActiveTab = focusTab[countD].id;
                var badgecontentsB = {text:"" + focusTab[countD].id};
                chrome.browserAction.setBadgeText(badgecontentsB);
            }
        }
    });
});

//find when a tab is activated
chrome.tabs.onActivated.addListener(function (activTab){
    console.log("------activated:" + activTab.tabId);
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabObjectsC) {
        for(var countE=0; countE<tabObjectsC.length; countE++) {
            focusTab[countE] = tabObjectsC[countE];
        }
        for (var countF=0; countF<focusTab.length; countF++){
            if(focusTab[countF]!=null) {
                lastActiveTab = focusTab[countF].id;
                var badgecontentsC = {text: "" + focusTab[countF].id};
                chrome.browserAction.setBadgeText(badgecontentsC);
            }
        }
    });
});

//find when a tab is replaced
chrome.tabs.onReplaced.addListener(function (replaced, original){
    console.log("------replaced:" + original + " with:" + replaced);
    //migrate cookies to new tab
    migrate(replaced, original);
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabObjectsD) {
        for(var countG=0; countG<tabObjectsD.length; countG++) {
            focusTab[countG] = tabObjectsD[countG];
        }
        for (var countH=0; countH<focusTab.length; countH++){
            if(focusTab[countH]!=null) {
                lastActiveTab = focusTab[countH].id;
                var badgecontentsD = {text: "" + focusTab[countH].id};
                chrome.browserAction.setBadgeText(badgecontentsD);
            }
        }
    });
});

//find when a tab is remove
chrome.tabs.onRemoved.addListener(function (remTab, myobjects){
    console.log("------removed:" + remTab);
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabObjectsE) {
        for(var countAA=0; countAA<tabObjectsE.length; countAA++) {
            focusTab[countAA] = tabObjectsE[countAA];
        }
        for (var countBB=0; countBB<focusTab.length; countBB++){
            if(focusTab[countBB]!=null) {
                lastActiveTab = focusTab[countBB].id;
                var badgecontentsG = {text: "" + focusTab[countBB].id};
                chrome.browserAction.setBadgeText(badgecontentsG);
            }
        }
    });
    migrate(-1,remTab);
});

//check for sneaky javascript cookies
chrome.cookies.onChanged.addListener(updateCookieStore);

//give cache a flush
chrome.webRequest.handlerBehaviorChanged();

//listen for network responses that contain headers
chrome.webRequest.onHeadersReceived.addListener(recvListener,{ urls: ["<all_urls>"]}, ["blocking", "responseHeaders"]);

//listen for network requests that contain headers
chrome.webRequest.onBeforeSendHeaders.addListener(reqListener,{ urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);

//function to mark incoming cookie names with tab number
//would prefer if an API to create a cookie store was available
function recvListener(incomingHeaders) {
    if (incomingHeaders!=null){
        var requestURL = incomingHeaders.url;
        var requestTab = incomingHeaders.tabId;
        var Headers = incomingHeaders.responseHeaders;
        var theEqualLocation = 0;
        for (index=0; index<Headers.length; index++) {
            if (Headers[index].name.toUpperCase()===setcookie) {
               console.log("inctab=" + requestTab);
                if (requestTab>=0||1==1){  //dont mark -1 labeled tabs
                    theEqualLocation = Headers[index].value.indexOf("=");
                    Headers[index].value = requestTab + mySeparator + Headers[index].value; //modify cookie name
                    //Headers[index].value = Headers[index].value.substring(0,(theEqualLocation+1)) + requestTab + mySeparator + Headers[index].value.substring((theEqualLocation+1)); //modify cookie value
                }
               //console.log(Headers[index]);
            }
        }
    }
    return {responseHeaders: Headers};
}

//function to strip tab number where appropriate from cookies
function reqListener(outgoingHeaders) {
    var tabPosition = 0;
    if (outgoingHeaders!=null){
        var requestURL = outgoingHeaders.url;
        var requestTab = outgoingHeaders.tabId;
        var cookiesTab = 28998;
        var Headers = outgoingHeaders.requestHeaders;
        var cookieArray;
        var tempHeader = "";
        var foundSeparatorPosition = 28999;
        var processedHeader = "";
        var splicepoint = 9999;
        for (indexA=0; indexA<Headers.length; indexA++) {
            if (Headers[indexA].name.toUpperCase()===justcookie) {
                tempHeader = Headers[indexA].value;
                //call function to inspect and/or modify outbound headers
                //console.log("pre ==" + processedHeader);
                processedHeader = tabLogic(tempHeader, requestURL, requestTab);
                Headers[indexA].value = "" + processedHeader;
                if (processedHeader.length<2) {
                    Headers[indexA].value = "";
                    splicepoint = indexA;
                }
            }
        }
        if (splicepoint<200) Headers.splice(splicepoint,1);
        for (indexAAA=0;indexAAA<Headers.length;indexAAA++){
            console.log(Headers[indexAAA].name + Headers[indexAAA].value + "\r\n");
        }
    }
    return {requestHeaders: Headers};
}

//function to analyze cookie jar and browser
//used with sending cookies
function tabLogic(CookieHeaderValue, url, sendingTab ) {
    var foundSeparatorPosition = 30999;
    var cookiesTab = 30998;
    var cookieArray;
    var tamperedCookieHeaderValue = CookieHeaderValue;
    var tamperedCookieString = "";
    var equalsLocation = 0;
    var imp;  //handle GMAIL_IMP cookie
    var tempLocator=0;
    var tempLocatorA=0;
    var matchName = false; //whether to modify cookie name or value
    cookieArray = tamperedCookieHeaderValue.split(defaultCookieSeparator);
    for (indexB=0; indexB<cookieArray.length; indexB++){
        imp=false;
        foundSeparatorPosition = cookieArray[indexB].indexOf(mySeparator);
        if (foundSeparatorPosition>=0){
            equalsLocation = cookieArray[indexB].indexOf("=");
            if (matchName) {
                equalsLocation++;
                 cookiesTab=parseInt(cookieArray[indexB].substring(equalsLocation,foundSeparatorPosition),10);
            }
            else
                cookiesTab=parseInt(cookieArray[indexB].substring(0,foundSeparatorPosition),10);
            console.log("ctab=" + cookiesTab + "; actab=" + sendingTab + "; " + cookieArray[indexB]);
            if (cookiesTab==sendingTab) { //cookies were set in the same tab we are in
                if (matchName)
                    tamperedCookieString = tamperedCookieString + cookieArray[indexB].substring(0,equalsLocation) + cookieArray[indexB].substring((foundSeparatorPosition+5)) + defaultCookieSeparator;
                else {
                    if(cookieArray[indexB].substring((foundSeparatorPosition+5),equalsLocation)==="GMAIL_IMP")
                        imp=true;
                    if (imp) {
                        console.log("rewriting imp");
                        if (cookieArray[indexB].indexOf("badhdr") > 3){
                            tempLocator=cookieArray[indexB].indexOf("!");
                            tempLocatorA=cookieArray[indexB].substring(foundSeparatorPosition+5).indexOf("ufp") - 1;
                            if (tempLocator>0)
                            tamperedCookieString = tamperedCookieString + cookieArray[indexB].substring((foundSeparatorPosition+5),tempLocator+1) + cookieArray[indexB].substring(tempLocatorA) + defaultCookieSeparator;
                        }
                        else {   //dont tamper with GMAIL_IMP
                           tamperedCookieString = tamperedCookieString + cookieArray[indexB].substring(foundSeparatorPosition+5) + defaultCookieSeparator;
                        }
                    }
                    else
                    tamperedCookieString = tamperedCookieString + cookieArray[indexB].substring(foundSeparatorPosition+5) + defaultCookieSeparator;
                }
            }
            else {
                tamperedCookieString = tamperedCookieString;  //do NOT include cookies for other tabs
            }
        }
        else {
            tamperedCookieString = tamperedCookieString; //do NOT include unmarked cookies
        }
    }
    if (tamperedCookieString.charAt(tamperedCookieString.length-1)===";" && tamperedCookieString.length>1) {
        tamperedCookieString = tamperedCookieString.substring(0,tamperedCookieString.length-1)  //subtract trailing semi-colon
        //console.log("removed semicolon");
    }
    if (tamperedCookieString.length<2)  tamperedCookieString="";
    return tamperedCookieString;
}


//function to handle incoming cookies without tab and marker
function updateCookieStore(changedata){
    var updCookie = changedata.cookie;
    var updCookieName = updCookie.name;
    var updCookieValue = updCookie.value;
    var updCookieDomain = updCookie.domain;
    var updCookieExpiry = updCookie.expirationDate;
    var updCookiePath = updCookie.path;
    var updCookieHTTP = updCookie.httpOnly;
    var updCookieSecure = updCookie.secure;
    var separatorLocation = 56022;
    var separatorMarker = 40294;
    var sameDomainTab = new Array(); //array of tabs matched
    var sameNameTab = new Array(); //array of names matched
    var countJ=0;
    var countK=0;
    var nameIdMatch = false;
    var firstMatch = 0;
    var successVal;
    var matchesActive = false;
    if (updCookiePath==null) updCookiePath="/";
    if (updCookieExpiry==null) updCookieExpiry=1499668630; //some future date
    if (updCookieDomain==null) console.log("null domain");
    separatorLocation = updCookieName.indexOf(mySeparator);
    if (separatorLocation>=0){
        //console.log("found sep");
        //nothing to do
    }
    else {
        console.log("JS cookie?:" + updCookieName + " dom:" + updCookieDomain + "path:" + updCookiePath);
        //updCookieHTTP=true; //dont let JS know we modified name
        //determine if we have cookies from same domain with markers
        if (true) { //delete JS cookies
            //change cookie name and store
            separatorLocation = updCookieName.indexOf(mySeparator);
            if (separatorLocation>=0) {  }
            else {
                
                //chrome.cookies.set({url: "https://"+updCookieDomain, name: "" + lastActiveTab + mySeparator  + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath + "", expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP});
                //chrome.cookies.set({url: "http://"+updCookieDomain, name: "" + lastActiveTab + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath + "", expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP});
            }
        }
        
        
        if (cookieCache!=null){
            for(alpha=0; alpha<cookieCache.length;alpha++){
                separatorMarker = cookieCache[alpha].name.indexOf(mySeparator);
                if (separatorMarker>=0){ //only review marked entries
                    if(updCookieDomain===cookieCache[alpha].domain) { //only review if same domain
                        console.log("match!");
                        //save with tabId if name not found in tabId
                        //save with tabId if
                        console.log(updCookieName + "??" + cookieCache[alpha].name.substring(separatorMarker+5));
                        sameDomainTab[countJ] = cookieCache[alpha].name.substring(0,separatorMarker); //array of tab numbers
                        if (updCookieName===cookieCache[alpha].name.substring(separatorMarker+5)) {
                            console.log("name matched!");
                            sameNameTab[countK] = sameDomainTab[countJ];
                            countK++;
                        }
                        countJ++;
                    }
                    else {
                        //console.log("miss:" + cookieCache[alpha].domain);
                    }
                }
            }
            //ready to set cookie with the tab number
            if (sameDomainTab.length>0 && sameNameTab.length>0){
                console.log("2 for loops");
                for(countM=0; countM<sameDomainTab.length;countM++){
                    for(countN=0; countN<sameNameTab.length;countN++){
                        if (sameDomainTab[countM]==sameNameTab[countN]) {
                            sameNameTab[countN]=""; //erase matching tabs from name array
                        }
                    }
                }
            }
            console.log("here.");
            //set cookie if no name match to first domain entry
            if (sameNameTab.length==0 && sameDomainTab.length>0) {
                successVal = 0;
                matchesActive=false;
                for(inde=0; index<sameDomainTab.length;inde++) {
                    if (sameDomainTab[inde]==lastActiveTab) {
                        matchesActive=true;
                    }
                }
                //fix make sure tab exists
                //if we match a cookie domain to the active tab, use that, otherwise use first match
                console.log("no name matched, setting after deleting" + lastActiveTab + mySeparator + updCookieDomain + " " + updCookieName+ " " + updCookieValue + " " + updCookiePath + " " + updCookieExpiry + " " + updCookieSecure + " " + updCookieHTTP);
                //delete unmarked cookies
                chrome.cookies.remove({url: "https://" + updCookieDomain + updCookiePath, name: "" + updCookieName});
                chrome.cookies.remove({url: "http://" + updCookieDomain + updCookiePath, name: "" + updCookieName});
                if (matchesActive){
                    successVal = chrome.cookies.set({url: "https://"+updCookieDomain, name: "" + lastActiveTab + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie1"); return 2;});
                    successVal = chrome.cookies.set({url: "http://"+updCookieDomain, name: "" + lastActiveTab + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie1"); return 2;});
                }
                else {
                    successVal = chrome.cookies.set({url: "https://"+updCookieDomain, name: "" + sameDomainTab[0] + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie1"); return 2;});
                    successVal = chrome.cookies.set({url: "http://"+updCookieDomain, name: "" + sameDomainTab[0] + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie1"); return 2;});
                }
                
                if (successVal>1) {console.log("Error with " + updCookieDomain + " " + updCookieName+ " " + updCookieValue + " " + updCookiePath + " " + updCookieExpiry + " " + updCookieSecure + " " + updCookieHTTP);}
            }
            else if (sameDomainTab.length==0) {
                //no matching domains for cookies found, save to activeTabId
                successVal = 0;
                console.log("no domains matched, setting after deleting" + lastActiveTab + mySeparator + updCookieName +updCookieValue);
                //delete unmarked cookies
                chrome.cookies.remove({url: "https://" + updCookieDomain + updCookiePath, name: "" + updCookieName});
                chrome.cookies.remove({url: "http://" + updCookieDomain + updCookiePath, name: "" + updCookieName});
                successVal = chrome.cookies.set({url: "https://"+updCookieDomain, name: "" + lastActiveTab + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie2"); return -1;});
                successVal = chrome.cookies.set({url: "https://"+updCookieDomain, name: "" + lastActiveTab + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie2"); return -1;});
                    if (successVal>1) {console.log("Error with " + updCookieDomain + " " + updCookieName+ " " + updCookieValue + " " + updCookiePath + " " + updCookieExpiry + " " + updCookieSecure + " " + updCookieHTTP);}
            }
            else {
                if (sameNameTab.length==0){ //unsure which tab it belongs to, set it to first domain match tabId or activeTab
                    successVal = 0;
                    console.log("domain match, no name match, activeTab" + lastActiveTab); // matched a domain
                    //delete unmarked cookies
                    chrome.cookies.remove({url: "https://" + updCookieDomain + updCookiePath, name: "" + updCookieName});
                    chrome.cookies.remove({url: "http://" + updCookieDomain + updCookiePath, name: "" + updCookieName});
                    successVal = chrome.cookies.set({url: "http://"+updCookieDomain, name: "" + lastActiveTab + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie3"); return 2;});
                    successVal = chrome.cookies.set({url: "https://"+updCookieDomain, name: "" + lastActiveTab + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie3"); return 2;});
                    if (successVal>1) {console.log("Error with " + updCookieDomain + " " + updCookieName+ " " + updCookieValue + " " + updCookiePath + " " + updCookieExpiry + " " + updCookieSecure + " " + updCookieHTTP);}
                }
                else {
                    //cookie found in multiple tabs, update most likely
                    console.log("whew!");
                    for(countP=0;countP<sameNameTab.length;countP++){
                       if (sameNameTab[countP]>=0){//fix check
                        //set cookie to this tab
                           successVal = 0;
                           //delete unmarked cookies
                           chrome.cookies.remove({url: "https://" + updCookieDomain + updCookiePath, name: "" + updCookieName});
                           chrome.cookies.remove({url: "http://" + updCookieDomain + updCookiePath, name: "" + updCookieName});
                           successVal = chrome.cookies.set({url: "http://"+updCookieDomain, name: "" + sameNameTab[countP] + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie"); return 2;});
                           successVal = chrome.cookies.set({url: "https://"+updCookieDomain, name: "" + sameNameTab[countP] + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie"); return 2;});
                           if (successVal>1) {console.log("Error with " + updCookieDomain + " " + updCookieName+ " " + updCookieValue + " " + updCookiePath + " " + updCookieExpiry + " " + updCookieSecure + " " + updCookieHTTP);}
                       }
                    }
                }
            }
        }
        else {console.log("cookie cache empty.");}

    }
    chrome.cookies.getAll({},cookieChecker);
}

//function to keep a cache of cookies based on updated calls to getallcookies()
function cookieChecker(myArray){
    cookieCache = myArray;
}

function tabCall(tabObjectG){
    if(chrome.runtime.lastError) console.log("tab doesnt exist:");
    return 0;
}

//function to move cookies to new tabId
function migrate (newID, oldID) {
    var cookieTabValue=93532;
    var cookieTabValueString = "";
    var separatorPlace=0;
    var thisSuccess;
    chrome.cookies.getAll({},cookieChecker);
    for(countQ=0; countQ<cookieCache.length; countQ++){
        thisSuccess=0;
        separatorPlace = cookieCache[countQ].name.indexOf(mySeparator);
        if (separatorPlace>=0) {
            cookieTabValueString = cookieCache[countQ].name.substring(0,separatorPlace);
            cookieTabValue = parseInt(cookieTabValueString);
            //console.log("z" + cookieTabValue + "x" + separatorPlace);
            //try to find missing tabs
            if (cookieTabValue>=0)
                thisSuccess = chrome.tabs.get(cookieTabValue, tabCall);
            console.log(thisSuccess + "---" + cookieTabValue);
            if (oldID<0) {   //delete cookies with tabs < 0
                chrome.cookies.remove({url: "https://" + cookieCache[countQ].domain + cookieCache[countQ].path, name: "" + oldID + mySeparator + cookieCache[countQ].name.indexOf(mySeparator+5)});
                chrome.cookies.remove({url: "https://" + cookieCache[countQ].domain + cookieCache[countQ].path, name: "" + oldID + mySeparator + cookieCache[countQ].name.indexOf(mySeparator+5)});
            }
            if (cookieTabValue==oldID) {
                console.log("Need to migrate me" + cookieCache[countQ].name + oldID + " to " + newID);
                chrome.cookies.remove({url: "https://" + cookieCache[countQ].domain + cookieCache[countQ].path, name: "" + cookieCache[countQ].name});
                chrome.cookies.remove({url: "http://" + cookieCache[countQ].domain + cookieCache[countQ].path, name: "" + cookieCache[countQ].name});
                if(newID>=0){  //only migrate tabs with IDs > 0
                    console.log("migrated");
                    chrome.cookies.set({url: "https://"+cookieCache[countQ].domain, name: "" + newID + mySeparator + cookieCache[countQ].name.substring(mySeparator+5), value: "" + cookieCache[countQ].value, domain: "" + cookieCache[countQ].domain, path: "" + cookieCache[countQ].path, expirationDate: cookieCache[countQ].expirationDate,secure: cookieCache[countQ].secure, httpOnly: cookieCache[countQ].httpOnly});
                    chrome.cookies.set({url: "http://"+cookieCache[countQ].domain, name: "" + newID + mySeparator + cookieCache[countQ].name.substring(mySeparator+5), value: "" + cookieCache[countQ].value, domain: "" + cookieCache[countQ].domain, path: "" + cookieCache[countQ].path, expirationDate: cookieCache[countQ].expirationDate,secure: cookieCache[countQ].secure, httpOnly: cookieCache[countQ].httpOnly});
                }
            }
        }
    }
}