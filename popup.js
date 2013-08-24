var twingl = chrome.extension.getBackgroundPage().twingl;
var pauseVariable = localStorage.paused;
var updateBlacklist = function(obj) {
  chrome.storage.sync.set(obj), function() {
    message("Status is changed.")
  }
}

var blacklist = {
  paused: false
}

chrome.storage.sync.get("paused", function(data){
  blacklist.paused = data.paused;
  if (blacklist.paused == true) {
    $("#pause").text("Unpause Extension");
  }
})

var pauseExtension = function() {
  if(blacklist.paused == true) {
    blacklist.paused = false;
    updateBlacklist(blacklist);
    $("#pause").text("Pause Extension");
  } else {
    blacklist.paused = true;
    updateBlacklist(blacklist);
    $("#pause").text("Unpause Extension");
  }
}

document.addEventListener('DOMContentLoaded', function () {
  $("#pause").click(function(){
    pauseExtension();
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
