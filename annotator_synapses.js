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
        //console.log(field, annotation);
      }
    });

    this.annotator.subscribe("annotationEditorShown", function(editor, annotation) {
      //console.log(annotation);
      var currentAnnotation = annotation;

      function openSynapser(event) {
        console.log(event.data);
        initSynapser(event.data.id);
      }

      if (synapseInjected != true) {
        $("#annotator-field-1").after("<button id='synapse'>Synapse</button>")
        synapseInjected = true;
        $("#synapse").on("click", currentAnnotation, openSynapser);
      } else {
        $("#synapse").off("click");
        $("#synapse").on("click", currentAnnotation, openSynapser);
      }
    })
    console.log(this, this.annotator);
    this.annotator.subscribe("annotationDeleted", function(annotation){
      updateHighlightList.remove(annotation.id);
    });

    this.annotator.subscribe("successfulCreation", function(annotation){
      updateHighlightList.add(annotation.id);
    });
    

  };
  return Synapses;
})();