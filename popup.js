var twingl = chrome.extension.getBackgroundPage().twingl;
var pauseExtension = function(obj) {
  chrome.storage.sync.set(obj), function() {
    message("Status is changed.")
  }
}

var currentURI = "http://www.kk.org/outofcontrol/"

chrome.tabs.getSelected(null, function(tab) {
    currentURI = tab.url;
});

var blackList = {
  loadIt: function() {
    chrome.storage.sync.get("blacklist", function(data){
      blackList.list = data;
    });
  },
  addTo: function(){
    blackList.list.blacklist.push(currentURI);
    chrome.storage.sync.set(blackList.list), function() {
      message("Site is on the shit list.") 
    };
  },
  removeFrom: function() {

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

  if(twingl.getAccessToken()) { 
    console.log("There's a token!")
    $("#sign-out").click(function(){
      twingl.clearAccessToken();
    })  
  }
  else {
   $("#sign-out").click(function(){
      console.log("No token.")
      twingl.authorize();
    })   
  }
  
});
