
var Global = require('./js/global.js')
console.log(Global);
var user = require('./js/user.js');
var utils = require('./js/utils.js');

var PORT = 9001;
var MAX_USERS = 0;


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

    if (Global.users.length == MAX_USERS) {
        // too many users!
        var temp_conn = request.accept('echo-protocol', request.origin);
        temp_conn.sendUTF('{"type": "failure", "message": "There are too many users connected."');
        temp_conn.close()
        return;
    }

    console.log('someone is connecting!');

    var connection = request.accept('echo-protocol', request.origin);
    var new_user = new user.User(connection);

    connection.sendUTF(JSON.stringify({'uuid': new_user.uuid}));
    connection.uuid = new_user.uuid;
    console.log("UUID assigned! Now they need to pick a name.");

    //console.log(Global.users);

    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            try {
                var cmd = JSON.parse(message.utf8Data);
                console.log(cmd);

                switch (cmd.type) {
                    case 'set_name':
                        Global.users[cmd.uuid].set_name(cmd.name);
                        break;
                    case 'set_job':
                        Global.users[cmd.uuid].set_job(cmd.job);
                        break;
                    case 'try_move':
                        Global.users[cmd.uuid].move(cmd.direction);
                        break;
                    case 'attack':
                        var attackingUser = Global.users[cmd.uuid];
                        switch (attackingUser.direction) {
                            case "up":
                                if (this.location[1] > 0) {
                                    var victim = Global.users[Global.arena[this.location[0]][this.location[1] - 1]];
                                }
                                break;
                            case "down":
                                if (this.location[1] < 19) {
                                    var victim = Global.users[Global.arena[this.location[0]][this.location[1] + 1]];
                                }
                                break;
                            case "left":
                                if (this.location[0] > 0) {
                                    var victim = Global.users[Global.arena[this.location[0] - 1][this.location[1]]];
                                }
                                break;
                            case "right":
                                if (this.location[0] < 19) {
                                    var victim = Global.users[Global.arena[this.location[0] + 1][this.location[1]]];
                                }
                                break;
                                
                            if (victim) {
                                // Victim's health goes down
                                victim.health--;
                                // If health is zero, then send death and update user's score, otherwise send new health
                                if (victim.health <= 0) {
                                    //Send death here
                                    victim.reset();
                                    attackingUser.score += 100;
                                } else {
                                    // Send new health
                                }
                            }
                        }
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
        Global.users[connection.uuid].destroy();
    });
});