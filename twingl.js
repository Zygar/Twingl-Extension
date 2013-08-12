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