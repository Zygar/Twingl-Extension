// I don't even know if this is where we want to do Auth.
// I do know that we will need Annotator's Auth plugin,
// which in turn will access a cached token.  

var twingl = new OAuth2('twingl', {
  client_id: '344063f810ddd7f7804f6b8036057cb4170e460f0434d75ce45c8482ff8bf36f',
  client_secret: 'cc6b4370b09e6dc6cf2bee46207650dd3e4531e5ff96f48888fb32604140acea',
  api_scope: 'private'
});

// Run our kitten generation script as soon as the document's DOM is ready.
// This is where we'll inject Annotator, I believe.
document.addEventListener('DOMContentLoaded', function () {
  twingl.authorize(function() {
    var API_URL = "http://local.dev:5000/api/flux/";

    if (twingl.getAccessToken()) {
      console.log(twingl.getAccessToken());
    };

    function callApi(action) {
      // Make an XHR that creates the task
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(event) {
        if (xhr.readyState == 4) {
          if(xhr.status == 200) {
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
