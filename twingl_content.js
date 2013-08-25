/* Twingl Content Script
 * Everything that touches the page happens here.
 * We grab a copy of the token and when that’s ready, we initialise Annotator.
 */
var annotatorMethods = {
  annotatorObject: null,
  init: function(token) {
    // Set up authentication headers.
    $.ajaxSetup({
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    // Get all highlights. (For the Twingler)
    $.ajax({
      url: "http://api.twin.gl/flux/highlights?context=twingl://mine",
      type: "GET",
      success: function(data) {
        renderHighlightsList(data);
      }
    });

    var theAnnotator = $(document.body).annotator();
    theAnnotator.annotator('addPlugin', 'Synapses').annotator('addPlugin', 'Auth', {
      token: token
    });
    theAnnotator.annotator('addPlugin', 'Store', {
      prefix: 'http://api.twin.gl/flux/',
      urls: {
        create: 'highlights?context=' + window.location,
        read: 'highlights/?context=' + window.location + '&expand=twinglings',
        update: 'highlights/:id',
        destroy: 'highlights/:id'
      }
    }).append("<div id='synapser'><ul></ul></div>"); // Construct the Synapser UI Element
    // Continue constructing and binding Synapser UI element.
    $('#synapser').append("<button id='synapser-close'>Close</button>");
    $('#synapser-close').click(function() {
      $("#synapser").toggleClass("visible");
    });

    // Inject highlights into the Synapser

    function renderHighlightsList(data) {
      for (var i = data.length - 1; i >= 0; i--) {
        current = data[i];
        $("#synapser ul").append("<li class='retrieved-highlight' data-id=" + current.id + ">" + current.quote + "</li>")
      };
    }
  },
  unload: function() {
    console.log(this.annotatorObject);
    this.annotatorObject.destroy();  
  }
}


chrome.storage.sync.get("paused", function(data){
  if (data.paused == true) {
    return false
  }
  else {
    authPlugin();
  }
})

function authPlugin() {
  chrome.runtime.sendMessage({
    request: "auth_token"
  }, function(response) {
    annotatorMethods.init(response.token);
  });
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
  console.log(changes);
  if (changes.paused.newValue == false) {
    authPlugin();
  } else {
    annotatorMethods.unload();
  }
});

/* Initialise the Synapser. It is passed the ID of the Highlight from which "Synapser" was invoked.*/

function initSynapser(annotation) {
  //console.log("Woo! We've initialised the synapser with ID " + active_highlight_id);
  var active_highlight_id = annotation.id;
  var currentTwinglings = [];
  $synapser = $("#synapser");
  $highlights = $("#synapser ul li");
  $synapser.addClass("visible");


  /** Retrieve Twinglings for "Active" highlight.
   * We don't want any interaction during this stage, so block with some CSS and display throbber.
   * We retrieve all Twinglings attached to the highlight from which
   * the Twingler was initialised. (active_highlight_id)
   * Then, we stuff start_id/end_id into a one-dimensional array: dropping
   * any ID which matches the current ID.
   * Finally, we initialise the "Highlight Checker"
   **/

  $synapser.addClass("working");

  // It just occurred to me. Now that we have a local copy of the annotation inside of
  // the Synapser, we don't necessarily need to request the Twinglings again. We can just
  // call annotator.twinglings.
  // I might do this later.
  $.ajax({
    url: "http://api.twin.gl/flux/highlights/" + active_highlight_id + "/twinglings",
    type: "GET",
    success: function(data) {
      for (var i = data.length - 1; i >= 0; i--) {
        var currentTwingling = data[i];
        currentTwingling.dest_id = null;

        if (currentTwingling.end_id != active_highlight_id) {
          currentTwingling.dest_id = currentTwingling.end_id;
        } else if (currentTwingling.start_id != active_highlight_id) {
          currentTwingling.dest_id = currentTwingling.start_id;
        } else {
          console.error("If this fires, something has gone seriously wrong. I'm not sure what that could be.")
        }
        currentTwinglings.push(currentTwingling);
        //console.log(currentTwinglings);
      };
      checkHighlights(currentTwinglings);
      modifyTwingling.annotation = annotation; // Pass the annotation object to modifyTwingling.
      $synapser.removeClass("working");
    }
  });


  /* This is the "Event Binding" loop. It goes through each returned highlight
     in the DOM, greys out the current highlight and "greens up" the active Twinglings.
     It also binds up the events, naturally. */

  function checkHighlights(currentTwinglings) {
    $highlights.each(function(i) {
      var $element = $(this);
      var current_dom_id = $element.data("id"); // Cache ID of each highlight through which we iterate.
      if (current_dom_id == active_highlight_id) {
        setState.active($element);
      } else if (currentTwinglings.length > 0) {
        setState.twinglable($element, active_highlight_id, current_dom_id);
        for (var i = currentTwinglings.length - 1; i >= 0; i--) {
          /* We loop through a list of all Twinglings associated with the current highlight.
             If any of them match the current DOM element in jQuery's $.each loop, we change its status to "Twingled".*/
          if (currentTwinglings[i].dest_id == current_dom_id) {
            var thisTwingling = currentTwinglings[i];
            setState.twingled($element, active_highlight_id, current_dom_id, thisTwingling);
          }
        };
      } else {
        setState.twinglable($element, active_highlight_id, current_dom_id)
      }
    }); // end $highlights.each
  } // end checkhighlights
} // end initSynapser

var setState = {
  twingled: function(elem, active_highlight_id, current_dom_id, twingling) {
    elem.addClass("twingled");
    elem.off("click").on("click", function() {
      modifyTwingling.destroy(elem, active_highlight_id, current_dom_id, twingling);
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
    var that = this;
    $.ajax({
      url: "http://api.twin.gl/flux/twinglings?expand=end_object",
      type: "POST",
      data: {
        start_type: "highlights",
        start_id: active_highlight_id,
        end_type: "highlights",
        end_id: current_dom_id
      },
      success: function(data) {
        //console.log("Great success! Twingling is create.", data);
        modifyTwingling.greatSuccess(elem, active_highlight_id, current_dom_id, "create", data, that.annotation);
      }
    })
  },
  destroy: function(elem, active_highlight_id, current_dom_id, twingling) {
    setState.working(elem);
    var that = this;
    $.ajax({
      url: "http://api.twin.gl/flux/twinglings/" + twingling.id,
      type: "DELETE",
      success: function(data) {
        //console.log("Great success! Twingling is very delete.");
        modifyTwingling.greatSuccess(elem, active_highlight_id, current_dom_id, "destroy", twingling, that.annotation);
      }
    })
  },
  greatSuccess: function(elem, active_highlight_id, current_dom_id, type, twingling, annotation) {
    elem.removeClass("working");
    that = this;
    if (type === "destroy") {
      setState.twinglable(elem, active_highlight_id, current_dom_id);
      that.annotator.publish("twinglingDestroyed", [twingling, annotation]);
    } else if (type === "create") {
      setState.twingled(elem, active_highlight_id, current_dom_id, twingling)
      $.ajax({
        url: "http://api.twin.gl/flux/twinglings/" + twingling.id + "?expand=end_object",
        type: "GET",
        success: function(data) {
          that.annotator.publish("twinglingCreated", [data, annotation]);
        }
      })
    }
  }
}

var updateHighlightList = {
  add: function(annotation) {
    $("#synapser ul").prepend("<li class='retrieved-highlight' data-id=" + annotation.id + ">" + annotation.quote + "</li>")
  },
  remove: function(annotation) {
    $("*[data-id=" + annotation.id + "]").remove();
  }
}