


Annotator.Plugin.Synapses = (function() {
  function Synapses(element, options) {
    this.element = element;
    this.options = options;
    console.log("Hello World!");
  }

  Synapses.prototype.pluginInit = function() {
    console.log("Initialized with annotator: ", this.annotator);
    this.annotator.editor.addField({
      label: 'Test',
      load: function(field, annotation) {

      }
    })
  };

  return Synapses;
})();

chrome.runtime.sendMessage({
  request: "auth_token"
}, function(response) {
  console.log(response.token); 
  var token = response.token
  $(document.body).annotator().annotator('addPlugin', 'Synapses').annotator('addPlugin', 'Auth', {
    token: response.token
  }).annotator('addPlugin', 'Store', {
    prefix: 'http://api.local.dev:5000/flux/',
    urls: {
      create: 'highlights?context=' + window.location,
      read:    'highlights/:id?context=' + window.location,
      update:  'highlights/:id?context=' + window.location,
      destroy: 'highlights/:id?context=' + window.location
    }
  });  
});




/*********

This is an example of Chrome's message API. 
In this case, I used it to get a copy of the token (which turned out to be unnecessary.)
However, it could be used to check if a token exists, and throw Annotator into 
"Read Only" mode if not.
*/


/****************/ 