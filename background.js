/* On Install */
// Technically, this gets set on event page load
var seedStorage = {
  paused: false,
  blacklist: {
    "stackoverflow.com": true
  }
};

// DEV: Reset storage.
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.clear(function(){
    console.log("The extension has been updated. Dumping storage.");
  });
  chrome.storage.sync.set(seedStorage, function(){
    console.log("New storage value has been set.");
  })
});


/* $01 – EVENT PAGE INITIALISED */

/* Initialise Variables */
window.token = null;
var twingl = new OAuth2('twingl', {
  client_id: '94da4493b8c761a20c1a3b4d532d9ab301745c137b88a574298dc1ebe99d5b14',
  client_secret: '6dd8eb63ff97c5f76a41bf3547e89792aef0d0ad45d13c6bc583d5939a3e600d',
  api_scope: 'private'
});

// Construct an empty sessionCache object.
var sessionCache = {
  global_status: null,
  tabs: {}
};


/* Define functions to run on initialisation */
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

/* Other important functions */
function checkBlacklist(url) {
  // TODO: Retrieve from storage. 
  // OTHER TODO: We might need to hardcode exceptions for certain URL patterns. No file:// etc
  var hostname = getHostname(url);
  console.log("Checking", hostname); 
  if (seedStorage.blacklist[hostname] == true) {
    return true;
  } else {return false}
};

function getHostname(url) {
  var domain = url.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];
  return domain;
};


/* Set State Variable */
getGlobalState();

/* Retrieve details of current session from localStorage */
// PENDING.


/* $02 – MAIN EVENTS */
/* Tab Update */
/* This listener fires when a tab starts loading, finishes loading. */

chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab) {
  if (sessionCache.global_status != "active") {
    console.log("Stopping. The browser plugin is in this state:", sessionCache.global_status);
  } else {
    // Anything in this else block will fire on ANY update event.
    // Including tab pinning, load and complete.
    if (changeInfo.status == "loading") {
      sessionCache.tabs[id] = {
        url: tab.url, 
        state: "loading"
      };
      console.log("Loading tab", id);
      console.log(sessionCache.tabs[id]);
      if (checkBlacklist(tab.url)) {
        console.log("Shit is blacklisted!");
        sessionCache.tabs[id].state = "blacklisted";
      };
    } else if (changeInfo.status == "complete") {
      console.log("Tab is loaded", id);

      if (sessionCache.tabs[id].state == "blacklisted") {
        if (tab.active == true) {console.log("tab is active, site is blacklisted")};
        // If it's blacklisted, we want to terminate here. 
        // If it's the active tab, we'll set the icon too. 
      } else {
        injectTwingl(tab);
      }
    }
  }
});

function injectTwingl(tab) {
  chrome.tabs.executeScript(tab.id, {code: "var token = '"+window.token+"'"}, function(){
    chrome.tabs.executeScript(tab.id, {file: 'twingl_content.js'}, function() {
      sessionCache.tabs[tab.id].state = "initialised";
      if (tab.active == true) {
        console.log("Script initialised in ACTIVE TAB! Set icon/popup NOW!")
      } else {
        console.log("Script initialised in BACKGROUND TAB! Set icon/popup on tab switch.")
      }
    })
  })
};


/* Tab Switch */
chrome.tabs.onActivated.addListener(function(tab){
  console.log("Switched to tab", sessionCache.tabs[tab.tabId]);

  if (sessionCache.global_status == "active") {
    if (sessionCache.tabs[tab.tabId] == undefined ) {
      console.log("This is either a new foreground tab, or the extension was inactive when this tab was created.")
    } else {
      var state = sessionCache.tabs[tab.tabId].state;
      if (state == "initialised") {
        console.log("You've switched to an initialised tab. Green icon for you!")
      } else if (state == "blacklisted") {
        console.log("this is a blacklisted site, we're going dark")
      } else if (state == "loading") {
        console.log("this tab is still loading, do nothing. The icon will automatically change when load completes")
      }
    }
  } else if(sessionCache.global_status == "paused") {
    console.log("Paused. Show the paused icon.")
  } else if (sessionCache.global_status == "signed_out") {
    console.log("Signed out. Show the signed out stuff.")
  } else {
    console.log("Something unexpected happened.", sessionCache)
  }
  
})

// BIG todos: 
// persist blacklist in chrome storage
// persist sessions in localstorage
// different popups
// event bindings 
// icon setting. 

/*
  On Event Page load:
  (This stuff happens EVERY TIME event page initialises regardless of state.)
    1. Retrieve pause status, assign to sessionCache object.
    ----2. Check if there's an auth token:
      1.1. If yes, but expired, request a new one, set state to authed.
      ----1.2. If no, set state to signed out.
    3. Retrieve session states from the localStorage cache.
  
  On event page unload
  1. Push session states to localStorage cache. 

  On tab switch:
  (switch, new foreground tab. This check will fire BEFORE tab.update)
    -- 0. Check global state. If paused or signed out, do no further checks. [Bind popup to respective action.]
    -- 1. Check the tab id against session cache object. Does it exist?.
      -- 1.1. If NO, it's a new foreground tab, or the extension was paused or signed out when this tab was created. (how to handle?)
      -- 1.2. If YES, check state. Is it loading, initialised or blacklisted?
    2. Set icons, change active popup based on the retrieved state.

  On tab update:
  (refresh, new tab(background or foreground), navigate to new page)

    Upon 'loading' event:
    1. Check global state.
      ----1.1. If paused or signed out, execute no further. (N.B. NO icon/popup code here. That is a tab switch concern.)
      ----1.2. Else, set up a listener for the "loaded" event.
    ---2. Create or update sessioncache object.
    3. Retrieve blacklist from chrome storage. ---Check HOSTNAME against blacklist.
      ---3.1. If exists, set state to "blacklisted".


    Upon 'loaded' event:
      1. Check if tab is active, so we know whether to set icon.
      ---- 2. Check sessioncache local status. [side note: what happens if the page loads before blacklist is checked?]
        ---- 2.1. If blacklisted, do not inject script, and terminate here.
          2.1.1. Set icon to blacklisted, if tab is active.
        ---- 2.2. If not blacklisted, inject script with auth token passed.

        Upon successful script injection:
          ---- 1. Set sessionCache status to "initialised"
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