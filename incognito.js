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
        var valueArray;
        var temp;
        var path_found = false;
        for (index=0; index<Headers.length; index++) {
            if (Headers[index].name.toUpperCase()===setcookie) {
              console.log(Headers[index]);
              valueArray = Headers[index].value.split(";");
                for (indexA=0; indexA<valueArray.length; indexA++){
                    temp = valueArray[indexA].toUpperCase();
                    temp = temp.trim();
                    temp = temp.substring(0,4);
                    if (temp === "PATH=") {path_found=true;valueArray[indexA].replace("=","=/"+requestTab)}
                }
                if (!path_found) {valueArray[indexA]="path=/"+requestTab;}
              Headers[index].value=Headers[index].value.replace("path=/", "path=/1/");
              console.log(Headers[index]);
              console.log("true");
            }
        }
    }
    return {responseHeaders: Headers};
}