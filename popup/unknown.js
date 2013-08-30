document.addEventListener('DOMContentLoaded', function () {
  chrome.runtime.getBackgroundPage(function(page) {
    var miscActions = page.miscActions;
    $("#refresh").click(function(){
      miscActions.refresh();
      window.close();
    });
  });
});