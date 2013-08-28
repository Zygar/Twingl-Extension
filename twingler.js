var twingler = {
  annotator: {},
  currentAnnotation: {}, // Not sure if we need to store the annotation here or not.
  $twingler: {},
  // Upon load, this string is rendered as HTML, and then replaced with a jQuery object.  
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
    console.log("Welcome to Twingler 2.0", annotation);
  },
  search: function(query) {
    $.ajax({
      url: 'http://api.twin.gl/flux/highlights/search',
      type: 'GET',
      data: {
        q: query
      },
      success: function(data){
        console.log(data);
      }
    });
  },
  done: function() {
    this.$twingler.hide();
  },
  unload: function() {
    this.$twingler.remove();
    this.$twingler = {};
  }
}