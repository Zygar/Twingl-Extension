/* Twingl Content Script
 * Everything that touches the page happens here.
 */

// console.log(token);
// console.log(isWhitelisted);
// console.log(window.contentScriptInjected);



if(injectedTwice != undefined) {
  annotatorMethods.reload();
} else {
  var annotatorMethods = {
    // annotatorObject: null,
    init: function(token) {
      // Set up authentication headers.
      $.ajaxSetup({
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      var theAnnotator = $(document.body).annotator();
      // console.log(theAnnotator);
      theAnnotator.annotator('addPlugin', 'Twinglings').annotator('addPlugin', 'Auth', {
        token: token
      });
      theAnnotator.annotator('addPlugin', 'Store', {
        prefix: 'http://api.twin.gl/v1/',
        urls: {
          create: 'highlights?context=' + window.location,
          read: 'highlights/?context=' + window.location + '&expand=twinglings',
          update: 'highlights/:id',
          destroy: 'highlights/:id'
        }
      });
      this.annotatorObject.subscribe("annotationCreatedSuccess", function() {
        if (isWhitelisted == false) {
          chrome.runtime.sendMessage({action: "updateWhitelist"}, function(response){
            isWhitelisted = response.status;
            // console.log(isWhitelisted);
          })
        }
      });
    },
    unload: function() {
      // console.log(this.annotatorObject);
      this.annotatorObject.destroy();  
      twingler.unload();
      annotatorMethods.init(token);
    },
    reload: function() {
      // console.log("Reloading Annotator.")
      this.unload();
    }
  }

  annotatorMethods.init(token);


};

// console.log(this);


/* Helper Functions */
var getHostname = function (url) {
  var domain = url.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];
  return domain;
};
