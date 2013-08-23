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

function initSynapser(active_highlight_id) {
  console.log("Woo! We've initialised the synapser with ID " + active_highlight_id);
  var currentTwinglings = [];

  $synapser = $("#synapser");
  $highlights = $("#synapser ul li");
  $synapser.addClass("visible");

  /* Retrieve Twinglings.
     This is somewhat blocking.  */
  $synapser.addClass("working");
  $.ajax({
    url: "http://api.twin.gl/flux/highlights/" + active_highlight_id + "/twinglings",
    type: "GET",
    success: function(data) {
      /* We retrieve all Twinglings attached to the highlight from which
         the Twingler was initialised. (active_highlight_id)

         Then, we stuff start_id/end_id into a one-dimensional array: dropping
         any ID which matches the current ID.

         Finally, we initialise the "Highlight Checker" */
      var allTwinglings = data;
      for (var i = data.length - 1; i >= 0; i--) {
        var currentTwingling = {
          twingling_id: data[i].id,
          dest_id: null
        }
        if (data[i].end_id != active_highlight_id) {
          currentTwingling.dest_id = data[i].end_id;

        } else if (data[i].start_id != active_highlight_id) {
          currentTwingling.dest_id = data[i].start_id;
          
        } else {
          console.error("If this fires, something has gone seriously wrong. I'm not sure what that could be.")
        }
        currentTwinglings.push(currentTwingling);
      };
      checkHighlights(currentTwinglings);
      $synapser.removeClass("working");
    }
  });

  
  /* This is the "Event Binding" loop. It goes through each returned highlight
     in the DOM, greys out the current highlight and "greens up" the active Twinglings.
     It also binds up the events, naturally. */ 

  function checkHighlights(currentTwinglings) {
    $highlights.each(function(i) {
      var $element = $(this);
      var current_dom_id = $element.data("id"); // Cache ID of each highlight in the list.
      if (current_dom_id == active_highlight_id) {
        setState.active($element);
      } else if (currentTwinglings.length > 0) {
        setState.twinglable($element, active_highlight_id, current_dom_id);
        for (var i = currentTwinglings.length - 1; i >= 0; i--) { 
          /* We loop through a list of all Twinglings associated with the current highlight.
             If any of them match the current DOM element in jQuery's $.each loop, we change its status to "Twingled".*/
          if (currentTwinglings[i].dest_id == current_dom_id) {
            var thisTwingling = currentTwinglings[i];
            setState.twingled($element, active_highlight_id, current_dom_id, thisTwingling.twingling_id);
          }
        };
      } else {
        setState.twinglable($element, active_highlight_id, current_dom_id)
      }
    }); // end $highlights.each
  } // end checkhighlights
} // end initSynapser

var setState = {
  twingled: function(elem, active_highlight_id, current_dom_id, twingling_id) {
    elem.addClass("twingled");
    elem.off("click").on("click", function() {
      modifyTwingling.destroy(elem, active_highlight_id, current_dom_id, twingling_id);
    })
  },
  twinglable: function(elem, active_highlight_id, current_dom_id) {
    elem.attr('class', 'retrieved-highlight');
    elem.off("click").on("click", function(event) {
      modifyTwingling.create(elem, active_highlight_id, current_dom_id);
    })
  },
  active: function(elem) {
    elem.off("click");
    elem.attr('class', 'current');
  }, 
  working: function(elem) {
    elem.addClass("working"); 
    elem.off("click");
  }
}

var modifyTwingling = {
  create: function(elem, active_highlight_id, current_dom_id) {
    setState.working(elem);
    $.ajax({
      url: "http://api.twin.gl/flux/twinglings",
      type: "POST",
      data: {
        start_type: "highlights",
        start_id: active_highlight_id,
        end_type: "highlights",
        end_id: current_dom_id
      },
      success: function(data) {
        console.log("Great success! Twingling is create.", data);
        modifyTwingling.greatSuccess(elem, active_highlight_id, current_dom_id, "create", data.id);
      }
    })
  },
  destroy: function(elem, active_highlight_id, current_dom_id, twingling_id) {
    setState.working(elem);
    $.ajax({
      url: "http://api.twin.gl/flux/twinglings/" + twingling_id,
      type: "DELETE",
      success: function(data) {
        console.log("Great success! Twingling is very delete.");
        modifyTwingling.greatSuccess(elem, active_highlight_id, current_dom_id, "destroy");
      }
    })
  },
  greatSuccess: function(elem, active_highlight_id, current_dom_id, type, twingling_id) {
    elem.removeClass("working");
    if(type === "destroy") {
      setState.twinglable(elem, active_highlight_id, current_dom_id)
    }
    else if (type === "create") {
      setState.twingled(elem, active_highlight_id, current_dom_id, twingling_id)
    }
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