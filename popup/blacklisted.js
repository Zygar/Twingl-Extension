document.addEventListener('DOMContentLoaded', function() {
  chrome.runtime.getBackgroundPage(function(page) {
    var authTwingl = page.authTwingl;
    var pauseTwingl = page.pauseTwingl;
    var blackLister = page.blackLister;

    $("#sign-out").click(function() {
      authTwingl.unauth();
      window.close();
    });
    $("#pause").click(function() {
      pauseTwingl.pause();
      window.close();
    });
    $("#remove-from-blacklist").click(function() {
      blackLister.unblacklist();
      window.close();
    });

  });
});