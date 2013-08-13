var twingl = new OAuth2('twingl', {
  client_id: '88b8a3ee21184a109ec90c7870571ac4c4c9a599cb54dd8cefff9b1e8b80ebac',
  client_secret: '13ade21bbe4c9084823cfa2984832c41baaa64aacbfc2531ee052c700f779f7d',
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
