// I don't even know if this is where we want to do Auth.
// I do know that we will need Annotator's Auth plugin,
// which in turn will access a cached token.  

var twingl = new OAuth2('twingl', {
  client_id: '88b8a3ee21184a109ec90c7870571ac4c4c9a599cb54dd8cefff9b1e8b80ebac',
  client_secret: '13ade21bbe4c9084823cfa2984832c41baaa64aacbfc2531ee052c700f779f7d',
  api_scope: 'http://local.dev:5000/api/v1'
});


// Run our kitten generation script as soon as the document's DOM is ready.
// This is where we'll inject Annotator, I believe.
document.addEventListener('DOMContentLoaded', function () {
   
});
