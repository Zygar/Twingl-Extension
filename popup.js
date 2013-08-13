// I don't even know if this is where we want to do Auth.
// I do know that we will need Annotator's Auth plugin,
// which in turn will access a cached token.  

var twingl = chrome.extension.getBackgroundPage().twingl;

document.addEventListener('DOMContentLoaded', function () {
  if(twingl.getAccessToken()) { 
    $("#sign-out").click(function(){
      twingl.clearAccessToken();
    })  
  }
  else {
   $("#sign-out").click(function(){
      twingl.authorize();
    })   
  }
  
});
