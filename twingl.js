


Annotator.Plugin.HelloWorld = (function() {
  function HelloWorld(element, options) {
    this.element = element;
    this.options = options;
    console.log("Hello World!");
  }

  HelloWorld.prototype.pluginInit = function() {
    console.log("Initialized with annotator: ", this.annotator);
    this.annotator.editor.addField({
      label: 'Test',
      load: function(field, annotation) {

      }
    })
  };

  return HelloWorld;
})();

chrome.runtime.sendMessage({
  request: "auth_token"
}, function(response) {
  console.log(response.token); 
  var token = response.token
  $(document.body).annotator().annotator('addPlugin', 'HelloWorld').annotator('addPlugin', 'Auth', {
    token: "841ae95d235d36396c31a31c7f7f3f49b38b89f61d1aac8ec84a0dc6183674ce"
  }).annotator('addPlugin', 'Store', {
    prefix: 'http://api.local.dev:5000/flux/',
    urls: {
      create: 'highlights?context=http://developer.chrome.com/extensions/tut_debugging.html',
      read:    'highlights/:id?context=http://developer.chrome.com/extensions/tut_debugging.html',
      update:  'highlights/:id?context=http://developer.chrome.com/extensions/tut_debugging.html',
      destroy: 'highlights/:id?context=http://developer.chrome.com/extensions/tut_debugging.html'
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