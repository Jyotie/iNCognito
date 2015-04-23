//set global variables
const secretKey = 45;
const setcookie = "SET-COOKIE";
const justcookie = "COOKIE";
const mySeparator = "BZPPf";
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
        for (index=0; index<Headers.length; index++) {
            if (Headers[index].name.toUpperCase()===setcookie) {
               console.log("inctab=" + requestTab);
                if (requestTab>=0){  //dont mark -1 labeled tabs
                    Headers[index].value = requestTab + mySeparator + Headers[index].value;
                }
               console.log(Headers[index]);
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
        for (indexA=0; indexA<Headers.length; indexA++) {
            if (Headers[indexA].name.toUpperCase()===justcookie) {
                tempHeader = Headers[indexA].value;
                //call function to inspect and/or modify outbound headers
                //console.log("pre ==" + processedHeader);
                processedHeader = tabLogic(tempHeader, requestURL, requestTab);
                Headers[indexA].value = "" + processedHeader;
                console.log("tampered ==" + processedHeader);
            }
        }
    }
    return {requestHeaders: Headers};
}

//function to analyze cookie jar and browser
function tabLogic(CookieHeaderValue, url, sendingTab ) {
    var foundSeparatorPosition = 30999;
    var cookiesTab = 30998;
    var cookieArray;
    var tamperedCookieHeaderValue = CookieHeaderValue;
    var tamperedCookieString = "";
    cookieArray = tamperedCookieHeaderValue.split(defaultCookieSeparator);
    for (indexB=0; indexB<cookieArray.length; indexB++){
        foundSeparatorPosition = cookieArray[indexB].indexOf(mySeparator);
        if (foundSeparatorPosition>=0){
            cookiesTab=parseInt(cookieArray[indexB].substring(0,foundSeparatorPosition),10);
            //console.log("ctab=" + cookiesTab + "; actab=" + sendingTab + "; " + cookieArray[indexB]);
            if (cookiesTab==sendingTab) { //cookies were set in the same tab we are in
                tamperedCookieString = tamperedCookieString + cookieArray[indexB].substring(foundSeparatorPosition+5) + defaultCookieSeparator;
            }
            else {
                tamperedCookieString = tamperedCookieString;
            }
        }
        else {
            tamperedCookieString = tamperedCookieString; //do include unmarked cookies
        }
    }
    tamperedCookieString = tamperedCookieString.substring(0,tamperedCookieString.length-1)  //subtract trailing semi-colon
    //console.log("sent:" + tamperedCookieString);
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
    var updCookieHTTP = false;
    var updCookieSecure = false;
    var separatorLocation = 56022;
    var separatorMarker = 40294;
    var sameDomainTab = new Array(); //array of tabs matched
    var sameNameTab = new Array(); //array of names matched
    var countJ=0;
    var countK=0;
    var nameIdMatch = false;
    var firstMatch = 0;
    var successVal;
    if (updCookiePath==null) updCookiePath="/";
    if (updCookieExpiry==null) updCookieExpiry=1499668630; //some future date
    if (updCookieDomain==null) console.log("null domain");
    separatorLocation = updCookieName.indexOf(mySeparator);
    if (separatorLocation>=0){
        //console.log("found sep");
        //nothing to do
    }
    else {
        console.log("JS cookie?:" + updCookieName + " dom:" + updCookieDomain);
        //determine if we have cookies from same domain with markers
        if (true) { //delete JS cookies
            chrome.cookies.remove({url: "https://" + updCookieDomain + updCookiePath, name: "" + updCookieName});
            chrome.cookies.remove({url: "http://" + updCookieDomain + updCookiePath, name: "" + updCookieName});
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
                for(countM=0; countM<sameDomainTab.length;countM++){
                    for(countN=0; countN<sameNameTab.length;countN++){
                        if (sameDomainTab[countM]==sameNameTab[countN]) {
                            sameNameTab[countN]=""; //erase matching tabs from name array
                        }
                    }
                }
            }
            //set cookie if no name match to first domain entry
            if (sameNameTab.length==0 && sameDomainTab.length>0) {
                successVal = 0;
                console.log("no name matched, setting " + sameDomainTab[0] + mySeparator + updCookieDomain + " " + updCookieName+ " " + updCookieValue + " " + updCookiePath + " " + updCookieExpiry + " " + updCookieSecure + " " + updCookieHTTP);
                successVal = chrome.cookies.set({url: "https://"+updCookieDomain, name: "" + sameDomainTab[0] + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie"); return 2;});
                if (successVal>1) {console.log("Error with " + updCookieDomain + " " + updCookieName+ " " + updCookieValue + " " + updCookiePath + " " + updCookieExpiry + " " + updCookieSecure + " " + updCookieHTTP);}
            }
            else if (sameDomainTab.length==0) {
                //no matching domains for cookies found, save to activeTabId or discard???
                successVal = 0;
                console.log("no domains matched" + lastActiveTab + mySeparator + updCookieName +updCookieValue);
                successVal = chrome.cookies.set({url: "https://"+updCookieDomain, name: "" + lastActiveTab + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie"); return -1;});
                    if (successVal>1) {console.log("Error with " + updCookieDomain + " " + updCookieName+ " " + updCookieValue + " " + updCookiePath + " " + updCookieExpiry + " " + updCookieSecure + " " + updCookieHTTP);}
            }
            else {
                if (sameNameTab.length==0){ //unsure which tab it belongs to, set it to first domain match tabId
                    successVal = 0;
                    console.log("domain match, no name match"); // matched a domain
                    successVal = chrome.cookies.set({url: "https://"+updCookieDomain, name: "" + sameDomainTab[0] + mySeparator + updCookieName, value: "" + updCookieValue, domain: "" + updCookieDomain, path: "" + updCookiePath, expirationDate: updCookieExpiry,secure: updCookieSecure, httpOnly: updCookieHTTP},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie"); return 2;});
                    if (successVal>1) {console.log("Error with " + updCookieDomain + " " + updCookieName+ " " + updCookieValue + " " + updCookiePath + " " + updCookieExpiry + " " + updCookieSecure + " " + updCookieHTTP);}
                }
                else {
                    //cookie found in multiple tabs, update most likely
                    for(countP=0;countP<sameNameTab.length;countP++){
                       if (sameNameTab[countP].length>0){
                        console.log("whew!" + sameNameTab[countP]);
                        //set cookie to this tab
                           successVal = 0;
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

//function to move cookies to new tabId
function migrate (newID, oldID) {
    var cookieTabValue=93532;
    var cookieTabValueString = "";
    var separatorPlace=0;
    var thisSuccess;
    for(countQ=0; countQ<cookieCache.length; countQ++){
        thisSuccess=0;
        separatorPlace = cookieCache[countQ].name.indexOf(mySeparator);
        if (separatorPlace>=0) {
            cookieTabValueString = cookieCache[countQ].name.substring(0,separatorPlace);
            cookieTabValue = parseInt(cookieTabValueString);
            console.log("z" + cookieTabValue + "x" + separatorPlace);
            if (cookieTabValue==oldID) {
                console.log("Need to migrate me" + oldID + " to " + newID);
                chrome.cookies.remove({url: "https://" + cookieCache[countQ].domain + cookieCache[countQ].path, name: "" + cookieCache[countQ].name});
                thisSuccess = chrome.cookies.set({url: "https://"+cookieCache[countQ].domain, name: "" + newID + mySeparator + cookieCache[countQ].name, value: "" + cookieCache[countQ].value, domain: "" + cookieCache[countQ].domain, path: "" + cookieCache[countQ].path, expirationDate: cookieCache[countQ].expirationDate,secure: cookieCache[countQ].secure, httpOnly: cookieCache[countQ].httpOnly},function(cookieSet) {if (cookieSet==null) console.log("unable to set cookie"); return 2;});
                if (thisSuccess>1) {console.log("Error with " + cookieCache[countQ].domain + " " + cookieCache[countQ].name);}
                
            }
        }
    }
}