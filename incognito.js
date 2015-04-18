//listen for changes to cookies
chrome.cookies.onChanged.addListener(listener);

//function to display cookie info
function listener(info) {
    if (info!=null){
       var cookie = info.cookie;
        console.log("dom:" + cookie.domain + ", jar:" + cookie.storeId + "\r\n");
    }
}