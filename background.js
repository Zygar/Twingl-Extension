chrome.runtime.onInstalled.addListener(function(){
  console.log("Anything that should run when the extension is first installed, such as initialising the blacklist/settings object, should go here.");
})

chrome.browserAction.setBadgeText({text: "ON"})
console.log("Loaded, son")

chrome.tabs.onActivated.addListener(function(){
  console.log("Switched to a tab, bro.")
})

chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab){
  console.log("Tab updated", id, changeInfo, tab);
  if(changeInfo.status == "loading") {
    console.log("Loading tab")
  }
  if(changeInfo.status == "complete") {
    console.log("Tab is loaded");
    injectTwingl(id);
    // Tab has finished loading. 
    // We now inject the content script if the content script should be injected.
  }
});

function injectTwingl(tab_id) {
  chrome.tabs.executeScript(tab_id, {
    file: 'twingl_content.js'
  }, function() {
    console.log("This is so fucking stupid.");
  }) 
}


function getPageURL() {

}


























// var twingl = new OAuth2('twingl', {
//   client_id: '94da4493b8c761a20c1a3b4d532d9ab301745c137b88a574298dc1ebe99d5b14',
//   client_secret: '6dd8eb63ff97c5f76a41bf3547e89792aef0d0ad45d13c6bc583d5939a3e600d',
//   api_scope: 'private'
// });

// var checkBlacklist = function(list, url) {
//   for (var i = list.length - 1; i >= 0; i--) {
//     if(list[i] == url) {
//       console.log("This site is in the blacklist. Not loading.")
//       return {blacklisted: true, index: i}
//     }
//   };
//   // If it makes it through the loop, the item is obv. not there. So return false.
//   return false;
// }

// chrome.storage.sync.get("paused", function(data){
//   if (data.paused == true) {
//     chrome.browserAction.setIcon({path: 'icon-sleeping.png'});
//     return false;
//   }
//   else {return false;}
// })

// chrome.storage.onChanged.addListener(function(changes, namespace) {
//   console.log(changes);
//   if (changes.paused != undefined) {
//     if (changes.paused.newValue == false) {
//       chrome.browserAction.setIcon({path: 'icon.png'});
//     } else {
//       chrome.browserAction.setIcon({path: 'icon-sleeping.png'});
//     }
//   }
// });


// document.addEventListener('DOMContentLoaded', function() {
//   console.log("This will only fire when extension is initialised.");
//   twingl.authorize(function() {
//     var API_URL = "http://api.twin.gl/api/flux/";
//     console.log("We have sent an auth request!")

//     if (twingl.getAccessToken()) {
//       window.token = twingl.getAccessToken();
//     };

//     function callApi(action) {
//       // Make an XHR that creates the task
//       var xhr = new XMLHttpRequest();
//       xhr.onreadystatechange = function(event) {
//         if (xhr.readyState == 4) {
//           if (xhr.status == 200) {
//             // Great success: parse response with JSON
//             $('#message').text(xhr.response);

//           } else {
//             // In our server there is problem.
//             $('#message').text('Error. Status returned: ' + xhr.status);
//           }
//         }
//       };

//       xhr.open('GET', API_URL + action, true);
//       xhr.setRequestHeader('Authorization', 'Bearer ' + twingl.getAccessToken());
//       xhr.send();
//     }

//   });

// });

// /** Example of a Message Listener. This can later be repurposed to tell
//     the content script whether or not a user is logged in.*/
// chrome.runtime.onMessage.addListener(
//   function(request, sender, sendResponse) {
//     console.log(sender.tab + sender.tab.url);
//     if (request.request == "auth_token") {
//       console.log("This will fire every time a page is loaded.")
//       sendResponse({
//         token: window.token
//       });
//     }
//   });

// chrome.runtime.onMessage.addListener(
//   function(request, sender, sendResponse) {
//     if (request.blacklist == "blacklist") {
//       console.log(request);
//       sendResponse({
//         exists: checkBlacklist(request.list, request.url)
//       });
//     }
//   });