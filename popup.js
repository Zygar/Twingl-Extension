var twingl = chrome.extension.getBackgroundPage().twingl;
var pauseExtension = function(obj) {
  chrome.storage.sync.set(obj), function() {
    message("Status is changed.")
  }
}

var blacklist = {
  "http://google.com/": true
}

var currentURI = "http://www.kk.org/outofcontrol/"

chrome.tabs.getSelected(null, function(tab) {
    currentURI = tab.url;
});



var blacklistSite = function() {
  blacklist[currentURI] = true;
  console.log(currentURI);
  console.log(blacklist);
  // chrome.storage.sync.set(blacklist), function() {
  //   message("Site is on the shit list.") 
  // }
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

chrome.storage.sync.get("blacklist", function(data){
  blacklist = data;
  console.log(blacklist)
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
  $("#pause").click(function(){
    pauseIt();
  });

  $("#blacklist").click(function(){
    blacklistSite();
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
