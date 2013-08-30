document.addEventListener('DOMContentLoaded', function() {
  chrome.runtime.getBackgroundPage(function(page) {
    var authTwingl = page.authTwingl;
    var pauseTwingl = page.pauseTwingl;
    var blackLister = page.blackLister;

    $("#sign-out").click(function() {
      authTwingl.unauth();
    });
    $("#pause").click(function() {
      pauseTwingl.pause();
    });
    $("#add-to-blacklist").click(function() {

    });
  });
});