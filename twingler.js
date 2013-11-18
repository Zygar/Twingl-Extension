// TODO:
// Results should only be rendered once—it's horribly inefficient right now. 
// Results should be ordered, somehow. 
// Test for duplication—I have a feeling that highlights and comments which share keywords will appear twice.
// Show all comments; not just first one. 

var twingler = {
  annotator: {},
  currentAnnotation: {}, // Not sure if we need to store the annotation here or not.
  currentTwinglings: [],
  $twingler: {}, // Maybe we store DOM elements as an array so we can systematically clear them upon "Done"
  init: function(annotator) {
    this.annotator = annotator; // Annotator object added to Twingler.
    this.annotator.wrapper.after("<div id='twingler-outer' class='twingler'><div id='twingler-inner'><div class='twingler-scrollable'><div class='twingl-current'><div class='twingl-current-highlight'></div><div class='twingl-current-comment'></div></div><input type='search' id='twingler-search-field' placeholder='Type a search here and press enter. Leave the field blank to get your 15 most recent highlights.'><ul class='twingl-search-results'><li class='twingler-search-status'>Does this passage remind you of something else? Create a Twingling to another passage to create a two-way link between the two items.</li></ul></div><button id='twingler-close' class='twingl-btn'>Done</button></div></div>");
    this.$twingler = $("#twingler-outer");
    this.$searchfield = $("#twingler-search-field");
    var that = this;
    
    // Bind events
    $('#twingler-close').click(function() {
      twingler.done();
    });
    $('#twingler-search-field').keypress(function(event) {
      if (event.which == 13) {
        twingler.search(that.$searchfield.val())
      };
    });

    console.log("Twingler has been initialised.", this);
  },
  begin: function(annotation) {
    this.$twingler.show();
    this.annotator.viewer.hide();
    $('body').addClass("modal-open");
    this.currentAnnotation = annotation;
    this.currentTwinglings = annotation.twinglings;
    this.$twingler.find(".twingl-current-highlight").text(twingler.currentAnnotation.quote);
    this.$twingler.find(".twingl-current-comment").text(twingler.currentAnnotation.text);

  },
  search: function(query) {
    // TODO: Hook up "Working" state.
    $searchresults = this.$twingler.find(".twingl-search-results"); 
    $searchresults.html("<li class='twingler-search-status'>Searching...</li>");
    if(query == "") {
      $.ajax({
        url: 'http://api.twin.gl/v1/highlights?context=twingl://mine&limit=15&sort=created&order=desc&expand=comments',
        type: 'GET',
        success: function(data){
          console.log(data);
          twingler.renderResults(data);
        }
      })
    } else {
      $.ajax({
        url: 'http://api.twin.gl/v1/search',
        type: 'GET',
        data: {
          q: query
        },
        success: function(data) {
          twingler.parseResults(data);
        },
        error: function(data, status, error) {
          console.log(data, status, error);
        }
      });  
    }
  },
  parseResults: function(results) {
    // Exclude current twinglings, current annotation from results.
    var currentAnnotation = this.currentAnnotation;
    var currentTwinglings = this.currentTwinglings;
    var newResults = [];
    console.log(results);
    
    function highlightCheck(id) {
      var isTwinglable = true;
      if (id == currentAnnotation.id) {
        isTwinglable = false;
        console.log(isTwinglable);
      } else if (currentTwinglings.length > 0) {
        for (var j = currentTwinglings.length - 1; j >= 0; j--) {
          if (currentTwinglings[j].end_id == id || currentTwinglings[j].start_id == id) {
            // IS A TWINGLING
            isTwinglable = false;
          }
        }
      };
      return isTwinglable;
    };

    for (var i = results.length - 1; i >= 0; i--) {
      var isTwinglable = true;
      var result = results[i].result_object; 
      var ref_id;
      console.log(result);
      
      if (results[i].result_type == "highlights") {
        ref_id = result.id;
        isTwinglable = highlightCheck(ref_id);
      } else if (results[i].result_type == "comments") {
        ref_id = result.commented_id;
        isTwinglable = highlightCheck(ref_id);
      };

      // Check whether result is a highlight or a comment. If it's a comment, evaluate the ID to see if it's Twinglable. If it is, check the highlight hasn't already been returned. If it hasn't, return the highlight. 
      if (isTwinglable == true) {
        // This is where we push the expanded object
        $.ajax({
          url: 'http://api.twin.gl/v1/highlights/'+ref_id+'?expand=comments',
          type: 'GET',
          success: function(data){
            console.log(data);
            newResults.push(data);
            console.log(newResults);
            twingler.renderResults(newResults);
          }
        })
      }
    };
    console.log(newResults);
    this.renderResults(newResults);
  },
  renderResults: function(results) {
    // TODO: We need a new results object: expanded highlights, with invalid Twinglings filtered out. 


    // TODO : Return "No Results" if empty.
    console.log(results);
    $searchresults = this.$twingler.find(".twingl-search-results");
    $searchresults.empty();
    if (results.length > 0 ){
      for (var i = results.length - 1; i >= 0; i--) {
        result = results[i];
        $searchresults.append("<li class='twingl-returned-result' data-id="+result.id+">" + result.quote + " <br> <small>"+result.comments[0].body +"</small></li>");
      };
      $('.twingl-returned-result').off('click').on('click', this.currentAnnotation, twinglerCrud.create);
    } else {
      $searchresults.html("<li class='twingler-search-status'>We couldn’t find anything matching those terms. Sorry! :-(</li>");
    }
    
  },
  done: function() {
    this.$twingler.find(".twingl-search-results").html("<li class='twingler-search-status'>Does this passage remind you of something else? Create a Twingling to another passage to create a two-way link between the two items.</li>");
    this.$twingler.hide();
    this.currentTwinglings = []; 
    $('body').removeClass("modal-open");
    // TODO: Unset all values, like search results. 
  },
  unload: function() {
    this.$twingler.remove();
    this.$twingler = {};
  }
}

var twinglerCrud = {
  create: function(event) { 
    var $elem = $(this);
    var annotation = event.data;
    var dest_id = $(this).attr("data-id");
    var src_id = annotation.id;
    
    twinglerCrud.working.start($elem);

    $.ajax({
      url: "http://api.twin.gl/v1/twinglings",
      type: "POST",
      data: {
        start_type: "highlights",
        start_id: src_id,
        end_type: "highlights",
        end_id: dest_id
      },
      success: function(data) {
        console.log("Great success! Twingling is create.", data);
        twinglerCrud.working.success($elem);
        $.ajax({ 
          // Get the freshly created Twingling and and attach it to the Annotation object.
          url: "http://api.twin.gl/v1/twinglings/" + data.id + "?expand=end_object",
          type: "GET",
          success: function(data) {
            twingler.annotator.publish("twinglingCreated", [data, annotation]);
          }
        });
      },
      error: function(data, status, error) {
        console.log(data, status, error);
        twinglerCrud.working.error($elem, error);
      }
    })
  },
  destroy: function(event) {
    var $elem = $(this).parent();
    var twingling_id = $elem.attr("data-id");
    var annotation = event.data;

    twinglerCrud.working.start($elem);

    $.ajax({
      url: "http://api.twin.gl/v1/twinglings/" + twingling_id,
      type: "DELETE",
      success: function(data) {
        twingler.annotator.publish("twinglingDestroyed", [twingling_id, annotation]);
        twinglerCrud.working.success($elem);
      },
      error: function(data, status, error) {
        console.log(data, status, error);
        twinglerCrud.working.error($elem, error);
      }
    });
  },
  working: {
    start: function(elem) {
      elem.off('click').addClass('working');
    },
    success: function(elem) {
      elem.remove();
    },
    error: function(elem) {
      // If there was an error, we need to bind an event to "Try Submitting Again". 
      // We also need to set an error class.
      // We also need the ability to "Report Bug"
    }
  }
}
