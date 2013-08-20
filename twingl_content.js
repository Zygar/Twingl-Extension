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
  }).append("<div id='synapser'><ul><li class='retrieved-highlight' id='124'>This is a highlight. We'll load them all.</li></ul></div>");
  $('.retrieved-highlight').click(function() {
    console.log("Click!");
    $(this).toggleClass("synapse-selected")
  });
  $('#synapser').append("<button id='synapser-close'>Close</button>");
  $('#synapser-close').click(function() {
    $("#synapser").toggleClass("visible");
  });
  function renderHighlightsList(data) {
    for (var i = data.length - 1; i >= 0; i--) {
      current = data[i];
      console.log(current);
      $("#synapser ul").append("<li class='retrieved-highlight' id="+ current.id +">"+current.quote + "</li>")
    };
  }
});