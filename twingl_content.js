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
      read: 'highlights/:id?context=' + window.location,
      update: 'highlights/:id?context=' + window.location,
      destroy: 'highlights/:id?context=' + window.location
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
      $("#synapser ul").append("<li class='retrieved-highlight' data-id=" + current.id + ">" + current.quote + "</li>")
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
  $synapser = $("#synapser");
  $highlights = $("#synapser ul li");
  $synapser.addClass("visible");

  /* Retrieve Twinglings */
  $.ajax({
    url: "http://api.twin.gl/flux/highlights/" + id + "/twinglings",
    type: "GET",
    success: function(data) {
      /* We retrieve all Twinglings attached to the highlight from which
         the Twingler was initialised. 

         Then, we stuff start_id/end_id into a one-dimensional array: dropping 
         any ID which matches the current ID.

         Finally, we initialise the "Highlight Checker" */

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

  /* Check retrieved highlights, change behaviour according to data 
       What is this highlight Twingled with? Highlight it! 
       What is the current highlight? Grey it out.
  */

  function checkHighlights(currentTwinglings) {
    $highlights.each(function(i) {
      var local_id = $(this).data("id"); // Cache ID of each highlight in the list.
      if (local_id == id) { // Exclude active highlight from the list. 
        $(this).addClass("current");
      } else { // Look for any highlights where the ID matches *anything* in the currentTwinglings array.
        for (var i = currentTwinglings.length - 1; i >= 0; i--) {
          if (currentTwinglings[i] == local_id) {
            $(this).addClass("twingled")
          }
          else {
            console.log(local_id);
            $(this).on("click", local_id, function(event){
              console.log(event.data);
            })
          }
        };
      }
    });

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