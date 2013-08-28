/* Twingl Content Script
 * Everything that touches the page happens here.
 * We grab a copy of the token and when that’s ready, we initialise Annotator.
 */
var getHostname = function (url) {
  var domain = url.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];
  return domain;
};

var currentURI = getHostname(window.location.href); 
// Using my ghetto function instead of window.location.hostname for consistency's sake. We don't want them
// to ever return different results. 

// Check if plugin is paused. If so, terminate.
chrome.storage.sync.get("paused", function(data) {
  if (data.paused == true) {
    return false
  }
  else {
    chrome.storage.sync.get("blacklist", function(data) {
      // If not, load the blacklist and run it against the current URL.
      blackListChecker(data.blacklist, currentURI)
    });
  }
})

function blackListChecker(list, url) {
  // Blacklist checker is stored in the background page because DRY. 
  chrome.runtime.sendMessage({
    blacklist: "blacklist",
    list: list,
    url: url
  }, function(response) {
    console.log(response);
    if (response.exists === false) {
      // If the blacklist checker comes back negative, let's rock.
      authPlugin()
    }
    else {
      // If it comes back undefined or as an object, it'll stop.
      return false
    }
  });
}

function authPlugin() {
  chrome.runtime.sendMessage({
    request: "auth_token"
  }, function(response) {
    annotatorMethods.init(response.token);
  });
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
  console.log(changes);
  if (changes.paused != undefined) {
    if (changes.paused.newValue == false) {
      authPlugin();
    } else {
      annotatorMethods.unload();
    }
  }
});

var annotatorMethods = {
  annotatorObject: null,
  init: function(token) {
    // Set up authentication headers.
    $.ajaxSetup({
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    var theAnnotator = $(document.body).annotator();
    theAnnotator.annotator('addPlugin', 'Twinglings').annotator('addPlugin', 'Auth', {
      token: token
    });
    theAnnotator.annotator('addPlugin', 'Store', {
      prefix: 'http://api.twin.gl/flux/',
      urls: {
        create: 'highlights?context=' + window.location,
        read: 'highlights/?context=' + window.location + '&expand=twinglings',
        update: 'highlights/:id',
        destroy: 'highlights/:id'
      }
    });
  },
  unload: function() {
    console.log(this.annotatorObject);
    this.annotatorObject.destroy();  
    twingler.unload();
  }
}
