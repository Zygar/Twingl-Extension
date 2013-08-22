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

  
  /* This is the "Event Binding" loop. It goes through each returned highlight
     in the DOM, greys out the current highlight and "greens up" the active Twinglings.
     It also binds up the events, naturally. */ 

  function checkHighlights(currentTwinglings) {
    $highlights.each(function(i) {
      var $element = $(this);
      var local_id = $element.data("id"); // Cache ID of each highlight in the list.
      setState.clean($element);

      if (local_id == id) {
        setState.active($element);
      } else if (currentTwinglings.length > 0) {
        setState.twinglable($element, id, local_id);
        for (var i = currentTwinglings.length - 1; i >= 0; i--) { 
          /* We loop through a list of all Twinglings associated with the current highlight.
             If any of them match the current DOM element in jQuery's $.each loop, we change its status to "Twingled".*/
          if (currentTwinglings[i].dest_id == local_id) {
            var thisTwingling = currentTwinglings[i];
            setState.twingled($element, thisTwingling.id);
          }
        };
      } else {
        setState.twinglable($element, id, local_id)
      }
    }); // end $highlights.each
  } // end checkhighlights
} // end initSynapser

var setState = {
  clean: function(elem) {
    elem.attr('class', 'retrieved-highlight');
    elem.off("click");
  },
  twingled: function(elem, id) {
    elem.addClass("twingled");
    elem.off("click").on("click", function() {
      modifyTwingling.destroy(elem, id);
    })
  },
  twinglable: function(elem, id, local_id) {
    elem.on("click", function(event) {
      modifyTwingling.create(elem, id, local_id);
    })
  },
  active: function(elem) {
    elem.addClass("current");
  }
}

var modifyTwingling = {
  working: function(elem) {
    console.log(elem);
    elem.addClass("working"); 
    // Add other event bindings here. 
    // We will also want to pass it the action—whether it's creation or deletion—so that the appropriate bindings can be update on success.
  },
  success: function(elem) {
    console.log(elem);
    elem.removeClass("working");
  },
  create: function(elem, source, dest) {
    this.working(elem);
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
        console.log(data);
        modifyTwingling.success(elem);
      }
    })
  },
  destroy: function(elem, id) {
    console.log("Now we will delete " + id);
    this.working(elem);
    $.ajax({
      url: "http://api.twin.gl/flux/twinglings/" + id,
      type: "DELETE",
      success: function(data) {
        console.log("Great success! Twingling is very delete.");
        modifyTwingling.success(elem);
      }
    })
  }
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