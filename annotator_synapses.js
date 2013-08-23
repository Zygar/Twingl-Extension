Annotator.Plugin.Synapses = (function() {
  var synapseInjected = false;

  function Synapses(element, options) {
    this.element = element;
    this.options = options;
  }

  Synapses.prototype.pluginInit = function() {
    this.annotator.viewer.addField({
      load: function(field, annotation) {
        console.log(annotation.twinglings)
        for (var i = annotation.twinglings.length - 1; i >= 0; i--) {
          console.log(annotation.twinglings[i].end_object.context_url)
          var twingling = annotation.twinglings[i].end_object;

          $(field).append("<a class='twingling' href='"+twingling.context_url+"'>" +twingling.quote+ "</a>");
        };
      }
    })
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
    
    this.annotator.subscribe("annotationDeleted", function(annotation){
      updateHighlightList.remove(annotation);
    });

    this.annotator.subscribe("annotationCreatedSuccess", function(annotation){
      console.log("Great success! Annotation created with ID" + annotation.id)
      updateHighlightList.add(annotation);
    });
    

  };
  return Synapses;
})();