var twingl = chrome.extension.getBackgroundPage().twingl;
var checkBlacklist = chrome.extension.getBackgroundPage().checkBlacklist;
var getHostname = function (url) {
  var domain = url.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];
  return domain;
};

var pauseExtension = function(obj) {
  chrome.storage.sync.set(obj), function() {
    message("Status is changed.")
  }
}

var currentURI = ""
var inBlacklist = false; 

chrome.tabs.getSelected(null, function(tab) {
    currentURI = getHostname(tab.url);
});

var blackList = {
  loadIt: function() {
    chrome.storage.sync.get("blacklist", function(data){
      blackList.list = data;
      inBlacklist = checkBlacklist(blackList.list.blacklist, currentURI);
      if (inBlacklist.blacklisted == true) {
        $("#blacklist").text("Remove from Blacklist");
        $("#blacklist").off("click").on("click", function(){blackList.removeFrom()});
      }
    });
  },
  addTo: function() {
    if (inBlacklist.blacklisted == true) {
      console.log("Hey buddy, this is in the blacklist")
    } else {
      console.log("Is not in blacklist")
      blackList.list.blacklist.push(currentURI);
      chrome.storage.sync.set(blackList.list), function() {
        message("Site is on the shit list.") 
      };
    }
  },
  removeFrom: function() {
    console.log(blackList.list.blacklist);
    blackList.list.blacklist.splice(inBlacklist.index, 1);
    chrome.storage.sync.set(blackList.list), function() {
      message("Site is on the shit list.") 
    };
  },
  empty: function() {
    blackList.list.blacklist = [];
    chrome.storage.sync.set(blackList.list), function() {
      message("Site is on the shit list.") 
    };
  }
} 

var pauseStatus = {
  paused: false
}

chrome.storage.sync.get("paused", function(data){
  pauseStatus.paused = data.paused;
  if (pauseStatus.paused == true) {
    $("#pause").text("Unpause Extension");
  }
})

var pauseIt = function() {
  if(pauseStatus.paused == true) {
    pauseStatus.paused = false;
    pauseExtension(pauseStatus);
    $("#pause").text("Pause Extension");
  } else {
    pauseStatus.paused = true;
    pauseExtension(pauseStatus);
    $("#pause").text("Unpause Extension");
  }
}

document.addEventListener('DOMContentLoaded', function () {
  blackList.loadIt();

  $("#pause").click(function(){
    pauseIt();
  });

  $("#blacklist").click(function(){
    blackList.addTo();
  });

  $("#reset").click(function(){
    blackList.empty();
  });

  if (twingl.getAccessToken()) { 
    console.log("There's a token!")
    $("#sign-out").text("Sign Out");
    $("#sign-out").click(function(){
      twingl.clearAccessToken();
    })  
  } else {
   $("#sign-out").text("Sign In");
   $("#sign-out").click(function(){
      console.log("No token.")
      twingl.authorize();
    })   
  }
  
});
