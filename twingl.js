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

$(document.body).annotator().annotator('addPlugin', 'HelloWorld').annotator('addPlugin', 'Store', {
  prefix: 'http://api.local.dev:5000/flux/',
  urls: {
    create: 'highlights?context=http://developer.chrome.com/extensions/tut_debugging.html',
    read:    'highlights/:id?context=http://developer.chrome.com/extensions/tut_debugging.html',
    update:  'highlights/:id?context=http://developer.chrome.com/extensions/tut_debugging.html',
    destroy: 'highlights/:id?context=http://developer.chrome.com/extensions/tut_debugging.html'
  }
});

/*********

This is an example of Chrome's message API. 
In this case, I used it to get a copy of the token (which turned out to be unnecessary.)
However, it could be used to check if a token exists, and throw Annotator into 
"Read Only" mode if not.
*/
// chrome.runtime.sendMessage({
//   request: "auth_token"
// }, function(response) {
//   window.twingl_auth_token = response.token;
//   console.log(window.twingl_auth_token); 
// });
/****************/ 