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

$(document.body).annotator().annotator('addPlugin', 'HelloWorld');

/*********

This is an example of Chrome's message API. 
In this case, I used it to get a copy of the token (which turned out to be unnecessary.)
However, it could be used to check if a token exists, and throw Annotator into 
"Read Only" mode if not.

chrome.runtime.sendMessage({
  request: "auth_token"
}, function(response) {
  window.twingl_auth_token = response.token;
  console.log(window.twingl_auth_token); 
});
****************/ 