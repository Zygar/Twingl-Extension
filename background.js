var twingl = new OAuth2('twingl', {
  client_id: '94da4493b8c761a20c1a3b4d532d9ab301745c137b88a574298dc1ebe99d5b14',
  client_secret: '6dd8eb63ff97c5f76a41bf3547e89792aef0d0ad45d13c6bc583d5939a3e600d',
  api_scope: 'private'
});

document.addEventListener('DOMContentLoaded', function() {
  console.log("This will only fire when extension is initialised.");
  twingl.authorize(function() {
    var API_URL = "http://api.twin.gl/api/flux/";
    console.log("We have sent an auth request!")

    if (twingl.getAccessToken()) {
      window.token = twingl.getAccessToken();
    };

    function callApi(action) {
      // Make an XHR that creates the task
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(event) {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            // Great success: parse response with JSON
            $('#message').text(xhr.response);

          } else {
            // Request failure: something bad happened
            $('#message').text('Error. Status returned: ' + xhr.status);
          }
        }
      };

      xhr.open('GET', API_URL + action, true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + twingl.getAccessToken());
      xhr.send();
    }

  });

});

/** Example of a Message Listener. This can later be repurposed to tell
    the content script whether or not a user is logged in.*/
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab + sender.tab.url);
    if (request.request == "auth_token") {
      console.log("This will fire every time a page is loaded.")
      sendResponse({
        token: window.token
      });
    }
  });
