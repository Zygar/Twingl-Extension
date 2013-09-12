document.addEventListener('DOMContentLoaded', function() {
  chrome.runtime.getBackgroundPage(function(page) {
    var authTwingl = page.authTwingl;
    var pauseTwingl = page.pauseTwingl;
    var blackLister = page.blackLister;
    var whiteLister = page.whiteLister;

    chrome.tabs.query({active: true, currentWindow: true}, function(data) {
      var url = data[0].url;
      var url = url.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];
      if (url === "kk.org") {
        $("#links").show();
        $("#links>ul").append('<li><a href="#">Quantified Self</a></li>');
        $("#links>ul").append('<li><a href="http://www.kk.org/outofcontrol/ch24-a.html">Out of Control [24] The Nine Laws Of God</a></li>');
        $("#links>ul").append('<li><a href="#">The Technium</a></li>');
      } else {
        $("#links").hide();
      }
    });

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
