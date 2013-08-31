/* Twingl Content Script
 * Everything that touches the page happens here.
 */

console.log(token);

var annotatorMethods = {
  annotatorObject: null,
  init: function(token) {
    // Set up authentication headers.
    $.ajaxSetup({
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    var theAnnotator = $(document.body).annotator();
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
  },
  unload: function() {
    console.log(this.annotatorObject);
    this.annotatorObject.destroy();  
    twingler.unload();
  }
}

annotatorMethods.init(token);

/* Helper Functions */
var getHostname = function (url) {
  var domain = url.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];
  return domain;
};
