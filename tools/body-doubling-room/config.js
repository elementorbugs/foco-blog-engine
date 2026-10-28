// FOCO body doubling room: the live backend. These values are public by design (they ship to every
// browser); the database rules in database.rules.json are what protect the data.
window.FOCO_ROOM_CONFIG = {
  roomId: 'main',
  shareUrl: 'https://www.tryfoco.com/body-doubling/',
  displayUrl: 'tryfoco.com/body-doubling',
  getUrl: 'https://www.tryfoco.com/get-foco/',
  firebase: {
    apiKey: 'AIzaSyCvapaOpU8GuMCi_cQGGN6vpuXgDVJwnuM',
    authDomain: 'foco-focus-room.firebaseapp.com',
    databaseURL: 'https://foco-focus-room-default-rtdb.firebaseio.com',
    projectId: 'foco-focus-room',
    appId: '1:92786424112:web:7e49c26c9e2ec331fe70f5',
  },
};
