/* Twingl Content Script
 * Everything that touches the page happens here.
 * We grab a copy of the token and when that’s ready, we initialise Annotator.
 */

chrome.runtime.sendMessage({
  request: "auth_token"
}, function(response) {
  console.log(response.token);
  var token = response.token;

  $.ajaxSetup({
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  $.ajax({
    url: "http://api.twin.gl/flux/highlights?context=twingl://mine",
    type: "GET",
    success: function(data) {
      renderHighlightsList(data);
    }
  });

  $(document.body).annotator().annotator('addPlugin', 'Synapses').annotator('addPlugin', 'Auth', {
    token: response.token
  }).annotator('addPlugin', 'Store', {
    prefix: 'http://api.twin.gl/flux/',
    urls: {
      create: 'highlights?context=' + window.location,
      read: 'highlights/?context=' + window.location,
      update: 'highlights/:id',
      destroy: 'highlights/:id'
    }
  }).append("<div id='synapser'><ul></ul></div>");
  $('#synapser').append("<button id='synapser-close'>Close</button>");
  $('#synapser-close').click(function() {
    $("#synapser").toggleClass("visible");
  });

  function renderHighlightsList(data) {
    for (var i = data.length - 1; i >= 0; i--) {
      current = data[i];
      //console.log(current);
      $("#synapser ul").append("<li class='retrieved-highlight' data-id=" + current.id + ">" + current.quote + "</li>")
    };
    $('.retrieved-highlight').click(function() {
      console.log("Click!");
      // $(this).toggleClass("synapse-selected")
    });
  }
});

function initSynapser(id) {
  console.log("Woo! We've initialised the synapser with ID " + id);
  var currentTwinglings = [];
  
  $synapser = $("#synapser");
  $highlights = $("#synapser ul li");
  $synapser.addClass("visible");

  /* Retrieve Twinglings.
     This is somewhat blocking.  */
  $.ajax({
    url: "http://api.twin.gl/flux/highlights/" + id + "/twinglings",
    type: "GET",
    success: function(data) {
      /* We retrieve all Twinglings attached to the highlight from which
         the Twingler was initialised.

         Then, we stuff start_id/end_id into a one-dimensional array: dropping
         any ID which matches the current ID.

         Finally, we initialise the "Highlight Checker" */
      var allTwinglings = data;
      for (var i = data.length - 1; i >= 0; i--) {
        var currentTwingling = {
          id: data[i].id,
          dest_id: null 
        }
        if (data[i].end_id != id) {
          currentTwingling.dest_id = data[i].end_id;
          //currentTwinglings.push(currentTwingling); // Do these need to be in the if/else blocks?
        } else if (data[i].start_id != id) {
          currentTwingling.dest_id = data[i].start_id;
          //currentTwinglings.push(currentTwingling);
        } else {
          console.error("If this fires, something has gone seriously wrong. I'm not sure what that could be.")
        }
        currentTwinglings.push(currentTwingling);
      };
      checkHighlights(currentTwinglings);
      //console.log(currentTwinglings);
    }
  });

  /* Check retrieved highlights, change behaviour according to data
       What is this highlight Twingled with? Highlight it!
       What is the current highlight? Grey it out.
  */
  function checkHighlights(currentTwinglings) {
    $highlights.each(function(i) {
      $(this).attr('class', 'retrieved-highlight'); // Reset visual state. 
      $(this).off("click"); // Unbind all click events. 
      var local_id = $(this).data("id"); // Cache ID of each highlight in the list.
      if (local_id == id) { // Exclude active highlight from the list.
        $(this).addClass("current");
      } 
      else if (currentTwinglings.length > 0) { 
        $(this).on("click", function(event) {
          console.log("Imma bindin' my click from " + id + " to " + local_id);
          submitTwingling(id, local_id);
        })
        for (var i = currentTwinglings.length - 1; i >= 0; i--) { // If there are Twinglings lready, let's add some classes
          if (currentTwinglings[i].dest_id == local_id) {
            var thisTwingling = currentTwinglings[i]; // We need to cache this because uh something to do with object properties.
            $(this).addClass("twingled");
            $(this).off("click").on("click", function(){
              deleteTwingling(thisTwingling.id);
            })
          }
        };
      } 
      else {
        $(this).on("click", function(event) {
          submitTwingling(id, local_id);
        })
      } 
    }); // end $highlights.each
  } // end checkhighlights
} // end initSynapser 

function submitTwingling(source, dest) {
  $.ajax({
    url: "http://api.twin.gl/flux/twinglings",
    type: "POST",
    data: {
      start_type: "highlights",
      start_id: source,
      end_type: "highlights",
      end_id: dest
    },
    success: function(data) {
      console.log(data, this)
    }
  })
}

function deleteTwingling(id) {
  console.log("Now we will delete " + id )
}

var updateHighlightList = {
  add: function(annotation) {
    $("#synapser ul").prepend("<li class='retrieved-highlight' data-id=" + annotation.id + ">" + annotation.quote + "</li>")
  },
  remove: function(annotation) {
    $("*[data-id="+annotation.id+"]").remove();
  }
}

// Probably need update-comment as well.



/*On page load, "modal" is created and all highlights are loaded in.
  (If a highlight gets added over the course of this instance, we'll append it. )
When "Synapse" button is hit, we show the "modal" and pass it the ID of the highlight.
  This will:
    -Grey out current highlight (no self synapses)-
    Turn all highlights that are synapsed-to (or from), green.
      To do this, we need to:
        Retrieve /twinglings for current highlight. This will return an array of inbound/outbound Twinglings.
        Normalise end_id and start_id; filtering out anything which matches current_id
        Change style of all highlights that match IDs in this list.  */