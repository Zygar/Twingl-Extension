var twingler = {
  annotator: {},
  currentAnnotation: {}, // Not sure if we need to store the annotation here or not.
  currentTwinglings: [],
  $twingler: {}, // Maybe we store DOM elements as an array so we can systematically clear them upon "Done"
  init: function(annotator) {
    this.annotator = annotator; // Annotator object added to Twingler.
    this.annotator.wrapper.append("<div id='twingler'><button id='twingler-close'>Done</button><input type='search' id='twingler-search-field'><button id='twingler-search'>Search</button><ul class='search-results'></ul></div>");
    this.$twingler = $("#twingler");
    this.$searchfield = $("#twingler-search-field");
    var that = this;

    // Bind events
    $('#twingler-close').click(function() {
      twingler.done();
    });
    $('#twingler-search').click(function() {
      twingler.search(that.$searchfield.val());
    });

    console.log("Twingler has been initialised.", this);
  },
  begin: function(annotation) {
    this.$twingler.show();
    this.currentAnnotation = annotation;
    this.currentTwinglings = annotation.twinglings;

    console.log("Welcome to Twingler 2.0", annotation);

  },
  search: function(query) {
    $.ajax({
      url: 'http://api.twin.gl/flux/highlights/search',
      type: 'GET',
      data: {
        q: query
      },
      success: function(data) {
        twingler.parseResults(data);
      }
    });
  },
  parseResults: function(results) {
    // Exclude current twinglings, current annotation from results.
    var currentAnnotation = this.currentAnnotation;
    var currentTwinglings = this.currentTwinglings;
    var newResults = [];

    for (var i = results.length - 1; i >= 0; i--) {
      var isTwinglable = true;

      if (results[i].result_id == currentAnnotation.id) {
        // IS NOT TWINGLABLE 
        isTwinglable = false; 
      } else if (currentTwinglings.length > 0) {
        for (var j = currentTwinglings.length - 1; j >= 0; j--) {
          if (currentTwinglings[j].end_id == results[i].result_id || currentTwinglings[j].start_id == results[i].result_id) {
            // IS A TWINGLING
            isTwinglable = false;
          }
        }
      };
      
      if (isTwinglable == true) {
        newResults.push(results[i]);
      }
    };

    renderResults(newResults);
  },
  renderResults: function(results) {
    console.log(results);
  },
  done: function() {
    this.$twingler.hide();
    this.currentTwinglings = []; // Do we need to reset? 
  },
  unload: function() {
    this.$twingler.remove();
    this.$twingler = {};
  }
}