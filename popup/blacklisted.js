document.addEventListener('DOMContentLoaded', function() {
  chrome.runtime.getBackgroundPage(function(page) {
    var authTwingl = page.authTwingl;
    var pauseTwingl = page.pauseTwingl;
    var whiteLister = page.whiteLister;

    $("#sign-out").click(function() {
      authTwingl.unauth();
      window.close();
    });
    $("#pause").click(function() {
      pauseTwingl.pause();
      window.close();
    });
    $("#remove-from-blacklist").click(function() {
      whiteLister.activate();
      window.close();
    });

  });
});