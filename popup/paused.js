document.addEventListener('DOMContentLoaded', function() {
  chrome.runtime.getBackgroundPage(function(page) {
    var pauseTwingl = page.pauseTwingl;
    $("#unpause").click(function() {
      pauseTwingl.unpause();
      window.close();
    });
  });
});