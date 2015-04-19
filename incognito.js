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
               console.log(Headers[index]);
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
        var cookiesTab = 999;
        var Headers = outgoingHeaders.requestHeaders;
        var cookieArray;
        var tempHeader = "";
        var foundSeparatorPosition = 999;
        for (index=0; index<Headers.length; index++) {
            if (Headers[index].name.toUpperCase()===justcookie) {
                //call function to inspect and/or modify outbound headers
                console.log(".");
                tempHeader = Headers[index].value;
                Headers[index].value = tabLogic(tempHeader, requestURL, requestTab);
                console.log(Headers[index].value);
            }
        }
    }
    return {requestHeaders: Headers};
}

//function to analyze cookie jar and browser
function tabLogic(CookieHeaderValue, url, sendingTab ) {
    var foundSeparatorPosition = 999;
    var cookiesTab = 999;
    var cookieArray;
    var tamperedCookieHeaderValue = CookieHeaderValue;
    var tamperedCookieString = "";
    cookieArray = tamperedCookieHeaderValue.split(defaultCookieSeparator);
    for (index=0; index<cookieArray.length; index++){
        foundSeparatorPosition = cookieArray[index].indexOf(mySeparator);
        if (foundSeparatorPosition>=0){
            
        }
    }
    return tamperedCookieString
}