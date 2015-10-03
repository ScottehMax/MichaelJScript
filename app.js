
var Global = require('./js/global.js')
var user = require('./js/user.js');
var utils = require('./js/utils.js');

var PORT = 9001;


var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(PORT, function() {
    console.log((new Date()) + ' | Server is listening on port ' + PORT);
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    console.log('someone is connecting!');

    var connection = request.accept('echo-protocol', request.origin);
    var new_user = new user.User(connection);
    connection.sendUTF(JSON.stringify({'uuid': new_user.uuid}));
    console.log("UUID assigned! Now they need to pick a name.");

    //console.log(Global.users);

    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            try {
                var cmd = JSON.parse(message.utf8Data);
                console.log(cmd);

                if (cmd.type === 'set_info') {
                    Global.users[cmd.uuid].set_info(cmd.name, cmd.job);
                }
                
                // checks for json here
            } catch (e) {
                console.log("YOU BUGGERED IT: " + e);
                connection.sendUTF('Error: invalid JSON');
            }
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data + ' received!');
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});