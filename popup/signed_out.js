document.addEventListener('DOMContentLoaded', function() {
  chrome.runtime.getBackgroundPage(function(page) {
    var authTwingl = page.authTwingl;
    $("#sign-in").click(function() {
      authTwingl.auth();
    });
  });
});