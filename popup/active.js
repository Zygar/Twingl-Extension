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
    $("#add-to-blacklist").click(function() {
      blackLister.add()
      window.close();
    });
  });
});