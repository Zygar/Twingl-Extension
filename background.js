/* Empty session cache on startup. Supposedly. I don't think this actually works. */
// If you log out, we problably need to clear your session as well.
// Every so often, we need to update your whitelist to make sure it's current. 
chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.remove('session', function() {
    chrome.storage.local.set({
      session: {
        global_status: null,
        tabs: {}
      }
    }, function() {
      console.log("We have obliterated the session cache.")
    });
  });
});

/* Seed data on installation. Migrate data when schema changes. */
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.get(null, function(data){
    if (data.schemaVersion == undefined) {
      seedStorageNow();
    } else if (data.schemaVersion == 1) {
      console.log("This is an upgrade. We'll put schema migrations in here.")
      data.schemaVersion = 2;
      delete data.blacklist;
      data.whitelist = {};
      var newStorage = data;
      chrome.storage.local.remove('blacklist', function(){
        chrome.storage.local.set(newStorage, function() {
          console.log("Update successful!")
        });  
      });
    }
  })
});

/* DEBUGGING — This will clear all items in local storage. */
function resetExtension() {
  chrome.storage.local.clear(function(){
    console.log("Storage has been totally emptied.")
  });
}

function seedStorageNow() {
  var seedStorage = {
    schemaVersion: 2,
    paused: false,
    whitelist: {
    },
    session: {
      global_status: null,
      tabs: {}
    }
  };
  chrome.storage.local.set(seedStorage, function(){
    console.log("This is a fresh install, so we have seeded your storage.");
    getLocalCache();
  })
}
// If you log out, we problably need to clear your session

/* $01 – EVENT PAGE INITIALISED */

/* Initialise Variables */
window.token = null;
var sessionCache = {};
var twingl = new OAuth2('twingl', {
  client_id: '94da4493b8c761a20c1a3b4d532d9ab301745c137b88a574298dc1ebe99d5b14',
  client_secret: '6dd8eb63ff97c5f76a41bf3547e89792aef0d0ad45d13c6bc583d5939a3e600d',
  api_scope: 'private'
});

/* Define functions to run on initialisation */
function getLocalCache() {
  chrome.storage.local.get(null, function(data) {
    if(data.schemaVersion != undefined) { // Check that local cache exists.
      whiteLister.whitelist = data.whitelist;
      sessionCache = data.session;
      console.log(data);
      if (data.paused === true) {
        sessionCache.global_status = "paused";
        chrome.storage.local.set({session: sessionCache}, function(){});
      } else {
        authTwingl.check();
      }
    } else {
      console.log("Nothing in local storage! Terminating extension.")
    }
  })
};

/* Define Helper Functions */
function getHostname(url) {
  var domain = url.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];
  return domain;
};


/* Set State Variable */
getLocalCache();


/* $02 – MAIN EVENTS */
/* Tab Update */
/* This listener fires when a tab starts loading, finishes loading. */

chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab) {
  if (sessionCache.global_status != "active") {
    console.log("Stopping. The browser plugin is in this state:", sessionCache.global_status);
    if(tab.active == true) {browserAction.setState(sessionCache.global_status)}
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
      if (whiteLister.check(tab.url) != true) {
        console.log("Shit is not whitelisted!!");
        sessionCache.tabs[id].state = "inactive";
        chrome.storage.local.set({session: sessionCache});
      };
    } else if (changeInfo.status == "complete") {
      console.log("Tab is loaded", id);
      if (sessionCache.tabs[id].state != "inactive") {
        injectTwingl(tab, true);
      } else {
        if (tab.active == true) {
          browserAction.setState("inactive");
        }
      }
    }
  }
});

function injectTwingl(tab, isWhitelisted) {
  chrome.tabs.executeScript(tab.id, {code: "var token = '"+window.token+"'; var isWhitelisted = "+isWhitelisted+";"}, function(){
    chrome.tabs.executeScript(tab.id, {file: 'twingl_content.js'}, function() {
      sessionCache.tabs[tab.id].state = "initialised";
      chrome.storage.local.set({session: sessionCache});
      if (tab.active == true) {
        console.log("Script initialised in ACTIVE TAB! Set icon/popup NOW!")
        browserAction.setState("active");
      } else {
        console.log("Script initialised in BACKGROUND TAB! Set icon/popup on tab switch.")
      }
    })
  })
};


/* Tab Switch */
chrome.tabs.onActivated.addListener(function(tab){
  /* NOTE. I just realised that it's possible to assign an icon and a popup specifically to a tab ID.
     Some of this logic, then, might be unnecessary. But I'm not sure. At any rate, it's not the worst inefficiency
     in the world and you can refactor again later.
  */
  console.log("Switched to tab", sessionCache.tabs[tab.tabId]);

  if (sessionCache.global_status == "active") {
    if (sessionCache.tabs[tab.tabId] == undefined ) {
      console.log("This is either a new foreground tab, or the extension was inactive when this tab was created. We'll display a 'refresh' popup. ")
      browserAction.setState("unknown");

    } else {
      var state = sessionCache.tabs[tab.tabId].state;
      if (state == "initialised") {
        console.log("You've switched to an initialised tab. Purple icon for you!");
        browserAction.setState("active");
      } else if (state == "inactive") {
        console.log("This site is not whitelisted, so we are going to go dark.")
        browserAction.setState("inactive");
      } else if (state == "loading") {
        console.log("this tab is still loading, do nothing. The icon will automatically change when load completes")
        browserAction.setState("unknown");
      }
    }
  } else if(sessionCache.global_status == "paused") {
    console.log("Paused. Show the paused icon.")
    browserAction.setState("paused");
  } else if (sessionCache.global_status == "signed_out") {
    browserAction.setState("signed_out");
  } else {
    console.log("Something unexpected happened.", sessionCache)
  }

})


var authTwingl = {
  auth: function() {
    twingl.authorize(function() {
      authTwingl.check();
    });
  },
  unauth: function() {
    twingl.clearAccessToken();
    browserAction.setState("signed_out");
    this.check();
  },
  check: function() {
    if (twingl.getAccessToken()) {
      window.token = twingl.getAccessToken();
      $.ajaxSetup({
        headers: {
          'Authorization': 'Bearer ' + window.token
        }
      });
      sessionCache.global_status = "active";
      chrome.storage.local.set({session: sessionCache});
      if(jQuery.isEmptyObject(whiteLister.whitelist)) {whiteLister.update(); console.log("Your whitelist appears to be empty. Checking.")}
    } else {
      sessionCache.global_status = "signed_out";
      chrome.storage.local.set({session: sessionCache});
    }
  }
};


var browserAction = {
  icons: {
    active: {
      path: {
        "19": "icons/active.png",
        "38": "icons/active@2x.png"
      }
    },
    inactive: {
      path: {
        "19": "icons/blacklisted.png",
        "38": "icons/blacklisted@2x.png"
      }
    },
    paused: {
      path: {
        "19": "icons/inactive.png",
        "38": "icons/inactive@2x.png"
      }
    },
    signed_out: {
      path: {
        "19": "icons/inactive.png",
        "38": "icons/inactive@2x.png"
      }
    },
    unknown: {
      path: {
        "19": "icons/inactive.png",
        "38": "icons/inactive@2x.png"
      }
    }
  },
  popups: {
    active: {
      popup: "popup/active.html"
    },
    inactive: {
      popup: "popup/blacklisted.html"
    },
    paused: {
      popup: "popup/paused.html"
    },
    signed_out: {
      popup: "popup/signed_out.html"
    },
    unknown: {
      popup: "popup/unknown.html"
    }
  },
  setState: function(state) {
    chrome.browserAction.setIcon(this.icons[state]);
    chrome.browserAction.setPopup(this.popups[state]);
  }
}

var pauseTwingl = {
  pause: function() {
    chrome.storage.local.set({paused: true}, function(){
      browserAction.setState("paused");
      sessionCache.global_status = "paused";
      chrome.storage.local.set({session: sessionCache});
      miscActions.refresh();
    });
  },
  unpause: function() {
    chrome.storage.local.set({paused: false}, function(){
      browserAction.setState("active");
      sessionCache.global_status = "active"; // Assume it's active and not signed out because YOLO
      authTwingl.check();
      chrome.storage.local.set({session: sessionCache});
      miscActions.refresh();
    });
    chrome.tabs.query({active: true, currentWindow: true}, function(data){
      if (sessionCache.tabs[data[0].id] == undefined) {
        browserAction.setState("unknown");
      } else if (sessionCache.tabs[data[0].id].state == "inactive") {
        browserAction.setState("inactive");
      } else if (sessionCache.tabs[data[0].id].state == "initialised") {
        browserAction.setState("active");
      } else {
        browserAction.setState("unknown");
        console.log("Don't know if this should ever fire.")
      }
    });
  }
}

// TODO: 
// 2. Either add a page action or a hotkey for initialising Twingler. 
var whiteLister = {
  whitelist: {}, 
  update: function() {
    // How often do we need to run this?
    // Probably just once. We could run it every time you add a highlight, but that is kind of lazy. 
    $.ajax({
      url: 'http://api.twin.gl/v1/contexts',
      type: 'GET',
      success: function(data) {
        whiteLister.whitelist = {};
        for (var i = data.length - 1; i >= 0; i--) {
          whiteLister.whitelist[getHostname(data[i].url)] = true;
        };
        console.log("successfully loaded whitelist")
        whiteLister.save();
      },
      error: function(data, status, error) {
        console.log(data, status, error);
      }
    });
  },
  save: function() {
    chrome.storage.local.set({whitelist: this.whitelist});
  },
  add: function() {
    // This should now trigger when an annotation is successfully created; but only if the site's hostname is not already in the whitelist
    chrome.tabs.query({active: true, currentWindow: true}, function(data) {
      var url = getHostname(data[0].url);
      whiteLister.whitelist[url] = true;
      whiteLister.save();
      miscActions.refresh();
    });
  },
  check: function(url) {
    var hostname = getHostname(url);
    if (whiteLister.whitelist[hostname] == true) {
      return true;
    } else {
      return false
    }
  },
  activate: function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(data) {
      injectTwingl(data[0], false);
      //miscActions.refresh();
    });
  }
}

var miscActions = {
  refresh: function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(data){
      chrome.tabs.reload(data[0].id);
    })
  }
}

chrome.tabs.onRemoved.addListener(function(id) {
  delete sessionCache.tabs[id];
  chrome.storage.local.set({session: sessionCache});
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "updateWhitelist") {
      whiteLister.update();
      sendResponse({status: true});
    }
  });


chrome.commands.onCommand.addListener(function(command) {
  if(command == "toggle-feature-foo") {
    chrome.tabs.query({active: true, currentWindow: true}, function(data) {
      tab = data[0];
      console.log(sessionCache.tabs, tab)
      if(sessionCache.tabs[tab.id].state == "inactive") {
        injectTwingl(tab, false);
      }
    });
  }
});

/* Notes 
  There's got to be some way of removing a site from the whitelist if you clobber your annotations. This is prob backend
*/