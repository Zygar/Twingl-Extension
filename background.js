/* Empty session cache on startup. Supposedly. I don't think this actually works. */
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
    } else {
      console.log("This is an upgrade. We'll put schema migrations in here.")
      // We will put "if schemaVersion = whatever" in here.
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
    schemaVersion: 1,
    paused: false,
    blacklist: {
      "frankchimero.com": true
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
      blackLister.blacklist = data.blacklist;
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
      if (blackLister.check(tab.url)) {
        console.log("Shit is blacklisted!");
        sessionCache.tabs[id].state = "blacklisted";
        chrome.storage.local.set({session: sessionCache});
      };
    } else if (changeInfo.status == "complete") {
      console.log("Tab is loaded", id);
      if (sessionCache.tabs[id].state == "blacklisted") {
        injectTwingl(tab);
      } else {
        if (tab.active == true) {
          browserAction.setState("blacklisted");
        }
      }
    }
  }
});

function injectTwingl(tab) {
  chrome.tabs.executeScript(tab.id, {code: "var token = '"+window.token+"'"}, function(){
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
        console.log("You've switched to an initialised tab. Green icon for you!");
        browserAction.setState("active");
      } else if (state == "blacklisted") {
        console.log("this is a blacklisted site, we're going dark")
        browserAction.setState("blacklisted");
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
      sessionCache.global_status = "active";
      chrome.storage.local.set({session: sessionCache});
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
    blacklisted: {
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
    blacklisted: {
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
      } else if (sessionCache.tabs[data[0].id].state == "blacklisted") {
        browserAction.setState("blacklisted");
      } else if (sessionCache.tabs[data[0].id].state == "initialised") {
        browserAction.setState("active");
      } else {
        browserAction.setState("unknown");
        console.log("Don't know if this should ever fire.")
      }
    });
  }
}

var blackLister = {
  blacklist: {},
  save: function() {
    chrome.storage.local.set({blacklist: this.blacklist});
  },
  add: function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(data) {
      var url = getHostname(data[0].url);
      blackLister.blacklist[url] = true;
      blackLister.save();
      miscActions.refresh();
    });
  },
  unblacklist: function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(data) {
      var url = getHostname(data[0].url);
      console.log(url);
      delete blackLister.blacklist[url];
      blackLister.save();
      miscActions.refresh();
    });
  },
  check: function(url) {
    var hostname = getHostname(url);
    if (blackLister.blacklist[hostname] == true) {
      return true;
    } else {
      return false
    }
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
