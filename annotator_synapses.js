Annotator.Plugin.Twinglings = function (element, options) {
  Annotator.Plugin.apply(this, arguments)
}

jQuery.extend(Annotator.Plugin.Twinglings.prototype, new Annotator.Plugin(), {
  events: {
    "#twinglings click": "twinglIt"
  },
  options: {},
  pluginInit: function() {
    var that = this; 
    console.log("Plugin successfully initialised.", this);
    
    modifyTwingling.annotator = this.annotator;
    annotatorMethods.annotatorObject = this.annotator;
    
    $(".annotator-controls").prepend("<a id='twinglings' href='#twingling'>Twinglings</a>");
    
    // Subscribe to events
    this.annotator
      .subscribe("annotationEditorShown", function(editor, annotation) {
        that.currentAnnotation = annotation;
      })
      .subscribe("annotationDeleted", function(annotation) {
        updateHighlightList.remove(annotation);
      })
      .subscribe("annotationCreated", function(annotation) {
        annotation.twinglings = []; // Prevent twinglings.length error on fresh Annotations.
      })
      .subscribe("annotationCreatedSuccess", function(annotation) {
        console.log("Great success! Annotation created with ID" + annotation.id)
        updateHighlightList.add(annotation);
      })
      .subscribe("twinglingCreated", function(twingling, annotation) {
        annotation.twinglings.push(twingling);
        // TODO: If a twingling was made to another item on the same page, we will need to update that
        // annotation as well. This turns it into a very hard problem and I'm inclined to say "fuck it"
        // for now. What we *need* is a persistent local model that can be kept in the background 
        // page at all times. This would also allow for live updating across pages. 
      })
      .subscribe("twinglingDestroyed", function(twingling, annotation) {
        for (var i = annotation.twinglings.length - 1; i >= 0; i--) {
          if (annotation.twinglings[i].id === twingling.id) {
            annotation.twinglings.splice(i, 1);
            return
          }
        };
      });
    // End Subscribe Chain
    
    /* Add Twinglings to the Tooltip */
    this.annotator.viewer.addField({
      load: function(field, annotation) {
        // Check if a Twingling is Inbound or Outbound, then append it to the list. 
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
    });
  },
  twinglIt: function(event) {
    Annotator.Util.preventEventDefault(event);
    console.log(this);
    this.annotator.editor.submit();
    if(this.currentAnnotation.id == undefined) {
      console.log("No id yet.")
      // If an ID does not exist, it needs to hold off until it gets a response before initialising it properly. 
      // Not sure yet how we listen for this. 
    } else {
      initSynapser(this.currentAnnotation);
    }
  }
});
