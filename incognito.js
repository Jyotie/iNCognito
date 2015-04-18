//listen for network responses
chrome.webRequest.onHeadersReceived.addListener(listener,{ urls: ["<all_urls>"]}, ["blocking", "responseHeaders"]);
var secretKey = 45;
var setcookie = "SET-COOKIE";
//function to blah
function listener(incomingHeaders) {
    if (incomingHeaders!=null){
        var requestURL = incomingHeaders.url;
        var requestTab = incomingHeaders.tabId;
        var Headers = incomingHeaders.responseHeaders;
        for (index=0; index<Headers.length; index++) {
            if (Headers[index].name.toUpperCase()===setcookie) {
              console.log(Headers[index]);
              Headers[index].value="testing";
              console.log(Headers[index]);
            }
        }
    }
    return {responseHeaders: Headers};
}