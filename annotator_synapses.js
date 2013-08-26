Annotator.Plugin.Synapses = (function() {
  var getHostname = function (url) {
    var domain = url.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];
    return domain;
  };

  var synapseInjected = false;

  function Synapses(element, options) {
    this.element = element;
    this.options = options;
  }

  Synapses.prototype.pluginInit = function() {
    modifyTwingling.annotator = this.annotator;
    annotatorMethods.annotatorObject = this.annotator;
    // We pass modifyTwingling the annotator object so that it can publish events.
    $(".annotator-controls").prepend("<a id='synapse' href='#twingling'>Twinglings</a>")
    this.annotator.viewer.addField({
      load: function(field, annotation) {
        // console.log(annotation.twinglings)
        for (var i = annotation.twinglings.length - 1; i >= 0; i--) {
          if (annotation.twinglings[i].start_id === annotation.id) {
            var twingling = annotation.twinglings[i].end_object;  
          } else {
            var twingling = annotation.twinglings[i].start_object;
          };
          twingling.quote = twingling.quote.substr(0, 125) + "&#8230";
          twingling.shortURL = getHostname(twingling.context_url);
          $(field).append("<a class='twingling' href='" + twingling.context_url + "'>" + twingling.quote + "<br><small>"+ twingling.shortURL +"</small> </a>");
        };
      }
    })
    

    this.annotator.subscribe("annotationEditorShown", function(editor, annotation) {
      
      
      var currentAnnotation = annotation;
      $("#synapse").off("click");
      $("#synapse").on("click", currentAnnotation, openSynapser)
      
      function openSynapser(event) {
      
        initSynapser(event.data);
      }

      
    })

    this.annotator.subscribe("annotationDeleted", function(annotation) {
      updateHighlightList.remove(annotation);
    });

    this.annotator.subscribe("annotationCreated", function(annotation) {
      annotation.twinglings = []; // Prevent twinglings.length error on fresh Annotations.
    })
    this.annotator.subscribe("annotationCreatedSuccess", function(annotation) {
      console.log("Great success! Annotation created with ID" + annotation.id)
      updateHighlightList.add(annotation);
    });


    // TODO: If a twingling was made to another item on the same page, we will need to update that
    // annotation as well. This turns it into a very hard problem and I'm inclined to say "fuck it"
    // for now. What we *need* is a persistent local model that can be kept in the background 
    // page at all times. This would also allow for live updating across pages. 

    this.annotator.subscribe("twinglingCreated", function(twingling, annotation) {
      annotation.twinglings.push(twingling);
    });

    this.annotator.subscribe("twinglingDestroyed", function(twingling, annotation) {
      for (var i = annotation.twinglings.length - 1; i >= 0; i--) {
        if (annotation.twinglings[i].id === twingling.id) {
          annotation.twinglings.splice(i, 1);
          return
        }
      };
    })


  };
  return Synapses;
})();