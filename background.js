var twingl = new OAuth2('twingl', {
  client_id: 'a3b14acebc6accce03312c6946e2982ee751d293cd2a3609ec8614f2eeade3ed',
  client_secret: 'e3f251a52c568b0692e3a8ef197817611dc087b25b652205d6243ddd482c4ea5',
  api_scope: 'private'
});

document.addEventListener('DOMContentLoaded', function() {
  console.log("This will only fire when extension is initialised.");
  twingl.authorize(function() {
    var API_URL = "http://sandbox.twin.gl/api/flux/";
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
            // In our server there is problem.
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
