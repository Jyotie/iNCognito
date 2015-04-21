//global variables
var counter = 0;
var focusTab = new Array();

//find when a tab is created
chrome.tabs.onCreated.addListener(function (newTab){
    console.log("------created:" + newTab.Id + "->" + newTab.url);
    chrome.tabs.query(function(tabObjectsA) {
        
        for(var countA=0; countA<tabObjectsA.length; countA++) {
            focusTab[countA] = tabObjectsA[countA];
        }
        for (var countB=0; countB<focusTab.length; countB++){
            if(focusTab[countB]!=null) {
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
        var thisTabB = new Array();
        for(var countC=0; countC<tabObjectsB.length; countC++) {
            thisTabB[countC] = tabObjectsB[countC];
        }
        for (var countD=0; countD<thisTabB.length; countD++){
            if(thisTabB[countD]!=null) {
                var badgecontentsB = {text:"" + thisTabB[countD].id};
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
                var badgecontentsC = {text: "" + focusTab[countF].id};
                chrome.browserAction.setBadgeText(badgecontentsC);
            }
        }
    });
});

//give cache a flush
chrome.webRequest.handlerBehaviorChanged();

//listen for network responses that contain headers
chrome.webRequest.onHeadersReceived.addListener(recvListener,{ urls: ["<all_urls>"]}, ["blocking", "responseHeaders"]);

//listen for network requests that contain headers
chrome.webRequest.onBeforeSendHeaders.addListener(reqListener,{ urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);

//set global variables
const secretKey = 45;
const setcookie = "SET-COOKIE";
const justcookie = "COOKIE";
const mySeparator = "::[p]";
const defaultCookieSeparator = ";";

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
               Headers[index].value = requestTab + mySeparator + Headers[index].value;
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
                console.log("pre ==" + processedHeader);
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
            console.log("ctab=" + cookiesTab + "; actab=" + sendingTab + "; " + cookieArray[indexB]);
            if (cookiesTab==sendingTab) { //cookies were set in the same tab we are in
                tamperedCookieString = tamperedCookieString + cookieArray[indexB].substring(foundSeparatorPosition+5) + defaultCookieSeparator;
            }
            else {
                tamperedCookieString = tamperedCookieString;
            }
        }
        else {
            tamperedCookieString = tamperedCookieString; //dont include unmarked cookies
        }
    }
    tamperedCookieString = tamperedCookieString.substring(0,tamperedCookieString.length-1)  //subtract trailing semi-colon
    return tamperedCookieString;
}