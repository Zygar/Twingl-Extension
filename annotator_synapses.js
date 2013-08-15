Annotator.Plugin.Synapses = (function() {
  var synapseInjected = false; 
  function Synapses(element, options) {
    this.element = element;
    this.options = options;
  }

  Synapses.prototype.pluginInit = function() {
    this.annotator.editor.addField({
      label: 'Synapses',
      load: function(field, annotation) {
        console.log(field, annotation);
      }
    });
    this.annotator.subscribe("annotationEditorShown", function(editor, annotation){
      console.log(editor, annotation);
      if (synapseInjected != true) {
        $("#annotator-field-1").after("<button id='synapse'>Synapse</button>")
        /*On click, we open a synapse window (that's already injected) with the highlight id passed to it. That's the only hard part, changing the param */
        $("#synapse").click(function() {
          console.log("Synapse window must now open");
          $("#synapser").toggleClass('visible'); // This isn't how we'll do it. 
        })
        synapseInjected = true;
      }
    })
  };

  return Synapses;
})();
