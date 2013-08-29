/* On Install */
// Technically, this gets set on event page load
var seedStorage = { 
  paused: false,
  blacklist: {
    "google.com": true
  }
}; 

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.clear(function(){
    console.log("The extension has been updated. Dumping storage.");
  });
  chrome.storage.sync.set(seedStorage, function(){
    console.log("New storage value has been set.");
  })
});


/* On Event Page Load */
// Initialise Variables
window.token = null;
var twingl = new OAuth2('twingl', {
  client_id: '94da4493b8c761a20c1a3b4d532d9ab301745c137b88a574298dc1ebe99d5b14',
  client_secret: '6dd8eb63ff97c5f76a41bf3547e89792aef0d0ad45d13c6bc583d5939a3e600d',
  api_scope: 'private'
});

// Construct an empty sessionCache construct
var sessionCache = { 
  global_status: null,
  1066: {
    state: "blacklisted" // blacklisted | initialised | loading? | do we have global states like paused, signed out? 
  }
};


// Define Functions
function getGlobalState() {
  chrome.storage.sync.get('paused', function(data) {
    if (data.paused === true) {
      sessionCache.global_status = "paused";
    }
    else {
      checkAuth();
    }
  })
};

function checkAuth() {
  if (twingl.getAccessToken()) {
    window.token = twingl.getAccessToken();
    sessionCache.global_status = "active";
  } else {
    sessionCache.global_status = "signed_out";
  }
};

// Retrieve global state 
getGlobalState();

/*
  On Event Page load: 
  (This stuff happens EVERY TIME event page initialises regardless of state.)
    1. Retrieve pause status, assign to sessionCache object. 
    2. Check if there's an auth token:
      1.1. If yes, but expired, request a new one, set state to authed.
      1.2. If no, set state to signed out.
    3. Retrieve session states from the localStorage cache. 

  On tab switch: 
  (switch, new foreground tab. This check will fire BEFORE tab.update)
    0. Check global state. If paused or signed out, do no further checks. [Bind popup to respective action.]
    1. Check the tab id against session cache object. Does it exist?. 
      1.1. If NO, it's a new foreground tab, or the extension was paused or signed out when this tab was created. (how to handle?)
      1.2. If YES, check state. Is it loading, initialised or blacklisted? 
    2. Set icon and change active popup based on the retrieved state. 

  On tab update: 
  (refresh, new tab(background or foreground), navigate to new page)
  
    Upon 'loading' event: 
    1. Check global state. 
      1.1. If paused or signed out, execute no further. (N.B. NO icon/popup code here. That is a tab switch concern.) 
      1.2. Else, set up a listener for the "loaded" event. 
    2. Create or update sessioncache object. 
      $tab_id: {
        url: $tab_url,
        state: "loading"
      }
    3. Retrieve blacklist from chrome storage. Check HOSTNAME against blacklist. 
      3.1. If exists, set state to "blacklisted". 


    Upon 'loaded' event:
      1. Check if tab is active, so we know whether to set icon. 
      2. Check sessioncache local status. [side note: what happens if the page loads before blacklist is checked?]
        2.1. If blacklisted, do not inject script, and terminate here. 
          2.1.1. Set icon to blacklisted, if tab is active. 
        2.2. If not blacklisted, inject script with auth token passed.

        Upon successful script injection: 
          1. Set sessionCache status to "initialised"
          2. If tab is active, set icon/popups to green. Otherwise, will be set on tab switch event
          3. Complete!   

  OTHER EVENTS:
    On tab close
      Destroy session variable
  
    On browser close
      Dump entire session cache. 
  
    Popup: Add to blacklist
      Retrieves blacklist from chrome storage.
      Gets the HOSTNAME of the current tab.
      Appends it to list as new object.
      Saves blacklist.
      Refreshes page. 
    
    Popup: On pause/unpause
      Set global pause status. 
      Write status to chrome.storage. 

    Popup: On sign out/in
      Set global status to signed out/in
      Sign out.


    On event page unload:
      Write current sessionCache object to localStorage. 
  

*/






/* Authentication Check */
/* This will fire whenever the event page is called. */




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
  chrome.tabs.executeScript(tab_id, {code: "var token = '"+window.token+"'"}, function(){
    chrome.tabs.executeScript(tab_id, {file: 'twingl_content.js'}, function(){
      console.log("Initialised content script.")
    })   
  })
};

function getPageURL() {

}



















// twingl.authorize(function() {
//   var API_URL = "http://api.twin.gl/api/flux/";
//   console.log("We have sent an auth request!")
//   function callApi(action) {
//     // Make an XHR that creates the task
//     var xhr = new XMLHttpRequest();
//     xhr.onreadystatechange = function(event) {
//       if (xhr.readyState == 4) {
//         if (xhr.status == 200) {
//           // Great success: parse response with JSON
//           $('#message').text(xhr.response);

//         } else {
//           // In our server there is problem.
//           $('#message').text('Error. Status returned: ' + xhr.status);
//         }
//       }
//     };
//     xhr.open('GET', API_URL + action, true);
//     xhr.setRequestHeader('Authorization', 'Bearer ' + twingl.getAccessToken());
//     xhr.send();
//   }
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