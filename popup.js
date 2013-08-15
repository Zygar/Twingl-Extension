// I don't even know if this is where we want to do Auth.
// I do know that we will need Annotator's Auth plugin,
// which in turn will access a cached token.  

var twingl = chrome.extension.getBackgroundPage().twingl;

document.addEventListener('DOMContentLoaded', function () {
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
