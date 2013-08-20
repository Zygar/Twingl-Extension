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
      create:   'highlights?context=' + window.location,
      read:     'highlights/:id?context=' + window.location,
      update:   'highlights/:id?context=' + window.location,
      destroy:  'highlights/:id?context=' + window.location
    }
  }).append("<div id='synapser'><ul></ul></div>");
  $('#synapser').append("<button id='synapser-close'>Close</button>");
  $('#synapser-close').click(function() {
    $("#synapser").toggleClass("visible");
  });
  
  function renderHighlightsList(data) {
    for (var i = data.length - 1; i >= 0; i--) {
      current = data[i];
      console.log(current);
      $("#synapser ul").append("<li class='retrieved-highlight' data-id="+ current.id +">"+current.quote + "</li>")
    };
    $('.retrieved-highlight').click(function() {
      console.log("Click!");
      $(this).toggleClass("synapse-selected")
    });
  }
});

function initSynapser(id) {

  console.log("Woo! We've initialised the synapser with ID " + id);
  var currentTwinglings = [];
  $.ajax({
    url: "http://api.twin.gl/flux/highlights/" + id + "/twinglings",
    type: "GET",
    success: function(data) {
      for (var i = data.length - 1; i >= 0; i--) {
        if (data[i].end_id != id) {
          currentTwinglings.push(data[i].end_id)
        } else if (data[i].start_id != id) {
          currentTwinglings.push(data[i].start_id)
        } else {
          console.log("I don't know when this would fire.")
        }
        checkHighlights(currentTwinglings);
      };
    }
  });

  $synapser = $("#synapser");
  $highlights = $("#synapser ul li");

  // $synapser.data("hl_id", id);
  $synapser.addClass("visible")

  
  function checkHighlights(currentTwinglings) {
    $highlights.each(function(i) {
      var local_id = $(this).data("id");
      console.log(i, local_id);
      if (local_id == id) {
        $(this).addClass("current");
      } else {
        for (var i = currentTwinglings.length - 1; i >= 0; i--) {
          if (currentTwinglings[i] == local_id) {
            $(this).addClass("twingled")
          }
        };
      }
    })
  }

}

function closeSynapser() {
  // Remove ID, reset style of all highlights.
}
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