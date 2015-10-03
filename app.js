
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

    if (Global.users.length >= MAX_USERS) {
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
                    case 'secret':
                        if (cmd.secret === "239668a2cf0991bc30347196cbadd50da8a9a6f7561ecf41d201884b4fac0151") {
                            // this is the console!
                            Global.console = Global.users[cmd.uuid].socket;
                            Global.console.sendUTF(JSON.stringify({"secret": true}));
                            Global.users[cmd.uuid].destroy();
                        }
                    case 'set_name':
                        Global.users[cmd.uuid].set_name(cmd.name);
                        break;
                    case 'set_job':
                        Global.users[cmd.uuid].set_job(cmd.job);
                        break;
                    case 'set_sprite':
                        Global.users[cmd.uuid].set_sprite(cmd.sprite);
                        break;
                    case 'try_move':
                        Global.users[cmd.uuid].move(cmd.direction);
                        Global.users[cmd.uuid].score += 100;
                        Global.users[cmd.uuid].socket.sendUTF(JSON.stringify({"score": Global.users[cmd.uuid].score}));
                        // Global.users[cmd.uuid].health -= 1;
                        Global.users[cmd.uuid].socket.sendUTF(JSON.stringify({"health": Global.users[cmd.uuid].health}));


                        if (Global.users[cmd.uuid].health === 0) {
                            //Send death here
                            Global.users[cmd.uuid].reset();
                            Global.users[cmd.uuid].socket.sendUTF(JSON.stringify({"score": Global.users[cmd.uuid].score}));
                        }

                        console.log(Global.users[cmd.uuid].location);
                        //Global.users[cmd.uuid].socket.sendUTF(JSON.stringify({"score": Global.users[cmd.uuid].score}));
                        //Global.users[cmd.uuid].socket.sendUTF(JSON.stringify({"health": Global.users[cmd.uuid].health}));
                        break;
                    case 'attack':
                        var attackingUser = Global.users[cmd.uuid];
                        var victim;
                        switch (attackingUser.direction) {
                            case "up":
                                var victim = Global.users[Global.arena[attackingUser.location[0]][attackingUser.location[1] - 1]];
                                break;
                            case "down":
                                var victim = Global.users[Global.arena[attackingUser.location[0]][attackingUser.location[1] + 1]];
                                break;
                            case "left":
                                var victim = Global.users[Global.arena[attackingUser.location[0] - 1][attackingUser.location[1]]];
                                break;
                            case "right":
                                var victim = Global.users[Global.arena[attackingUser.location[0] + 1][attackingUser.location[1]]];
                                break;
                        }   
                        if (victim) {
                            // Victim's health goes down
                            victim.health -= 1;
                            // If health is zero, then send death and update user's score, otherwise send new health
                            if (victim.health === 0) {
                                //Send death here
                                victim.socket.sendUTF(JSON.stringify({"score": victim.score,
                                                                      "health": victim.health}));
                                victim.reset();
                                attackingUser.score += 100;
                                attackingUser.socket.sendUTF(JSON.stringify({"score": attackingUser.score}));
                            } else {
                               victim.socket.sendUTF(JSON.stringify({"health": victim.health}));
                            }
                        }
                        
                        break;
                    case 'get_info':
                        Global.users[cmd.uuid].socket.sendUTF(JSON.stringify({"score": Global.users[cmd.uuid].score,
                                                                              "health": Global.users[cmd.uuid].health}));
                }

            } catch (e) {
                console.log("YOU BUGGERED IT: " + e);
                connection.sendUTF('Error: invalid JSON');
                var cmd = {};
            }

                // checks for json here
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