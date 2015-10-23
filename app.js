/*jslint node: true */
"use strict";

var Global = require('./js/global.js'),
    user = require('./js/user.js'),
    utils = require('./js/utils.js'),
    WebSocketServer = require('websocket').server,
    localtunnel = require('localtunnel'),
    http = require('http'),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

var MAX_USERS = 20;
var socketUrl = '';

// Hi everyone!
console.log('\n   ===================================================\n');
console.log('  #   #   #    #### #   #  #### #       #    #### #   #');
console.log('  #   #  # #  #     #  #  #     #      # #  #     #   #');
console.log('  #   #  # #  #     # #   #     #      # #  #     #   #');
console.log('  ##### ##### #     ##     ###  #     #####  ###  #####');
console.log('  #   # #   # #     # #       # #     #   #     # #   #');
console.log('  #   # #   # #     #  #      # #     #   #     # #   #');
console.log('  #   # #   #  #### #   # ####  ##### #   # ####  #   #');
console.log('\n   ===================================================\n');

// Set up websocket server
var socketServer = http.createServer(function (request, response) {
  response.writeHead(404);
  response.end();
});

socketServer.listen(9001, function () {
  console.log('[SETP] Websocket server live on port 9001');
});

var wsServer = new WebSocketServer({
  httpServer: socketServer,
  autoAcceptConnections: false
});

var socketTunnel = localtunnel(9001, {'subdomain': 'guts2015ws'}, function(err, tunnel) {
  socketUrl = 'ws' + tunnel.url.substring(5);
  console.log('[SETP] Websocket server public on ' + socketUrl);
});

// Set up web server
var webServer = http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname,
      filename = path.join(process.cwd(), uri);

  if(uri == '/getSocketUrl'){
    response.writeHead(200, {"Content-Type": "text/json"});
    response.write(socketUrl);
    response.end();
    return;
  }

  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200, {"Socket-Url": socketUrl});
      response.write(file, "binary");
      response.end();
    });
  });
});

webServer.listen(80, function () {
  console.log('[SETP] Web server live on port 80');
});

var webTunnel = localtunnel(80, {'subdomain': 'guts2015'}, function(err, tunnel) {
  console.log('[SETP] Web server public on ' + tunnel.url);
});

function originIsAllowed() { return true; }

function spawnPowerup() {
  if (Math.floor(Math.random() * 100) === 0) {
    var try_location = [utils.randint(0, 20), utils.randint(0, 20)], type = ["heart", "coin"][Math.floor(Math.random() * 2)];
    while (Global.arena[try_location[0]][try_location[1]]) {
      try_location = [utils.randint(0, 20), utils.randint(0, 20)];
    }
    Global.powerup.push(try_location);
    Global.poweruptype.push(type);
    Global.console.sendUTF(JSON.stringify({"type": "spawnPowerup", "powertype": type, "location": try_location}));
  }
}

wsServer.on('request', function (request) {
  if (!originIsAllowed()) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    return;
  }

  if (Object.keys(Global.users).length > MAX_USERS) {

    request.reject();
    return;
    // too many users!
  }

  console.log('[INFO] User Connecting...');

  var connection = request.accept('echo-protocol', request.origin);
  var new_user = new user.User(connection);

  connection.sendUTF(JSON.stringify({'uuid': new_user.uuid}));
  connection.uuid = new_user.uuid;
  console.log("[INFO] User UUID Assigned, picking name...");

  //console.log(Global.users);

  console.log('[INFO] User Connection Accepted.');

  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      var i, cmd;
      try {
        cmd = JSON.parse(message.utf8Data);
      } catch (e) {
        console.log("[ERRR] " + e);
        connection.sendUTF('Error: invalid JSON');
        cmd = {};
      }

      console.log(cmd);

      setTimeout(function () {
        spawnPowerup();
      }, Math.floor(Math.random() * 10000));

      switch (cmd.type) {
      case 'secret':
        if (cmd.secret === "239668a2cf0991bc30347196cbadd50da8a9a6f7561ecf41d201884b4fac0151") {
          // this is the console!
          Global.console = Global.users[cmd.uuid].socket;
          Global.console.sendUTF(JSON.stringify({"secret": true}));
          for (i = 0; i < 20; i++) {
            Global.arena[i] = new Array(20);
            Global.arena[i].fill(false);
          }
        }
        break;
      case 'respawn':
        Global.users[cmd.uuid].set_location();
        console.log('[INFO] ' + Global.users[cmd.uuid].name + ' respawned.')
        break;
      case 'set_name':
        Global.users[cmd.uuid].set_name(cmd.name);
        console.log('[INFO] Hello ' + Global.users[cmd.uuid].name + '!')
        break;
      case 'set_job':
        Global.users[cmd.uuid].set_job(cmd.job);
        break;
      case 'set_sprite':
        Global.users[cmd.uuid].set_sprite(cmd.sprite);
        break;
      case 'try_move':
        Global.users[cmd.uuid].move(cmd.direction);
        break;
      case 'attack':
        utils.sendConsole(JSON.stringify({"uuid":cmd.uuid, "attack": true}));
        var victim, attackingUser = Global.users[cmd.uuid];
        try {
          if (attackingUser.health !== 0) {
            switch (attackingUser.direction) {
              case "up":
                victim = Global.users[Global.arena[attackingUser.location[0]][attackingUser.location[1] - 1]];
                break;
              case "down":
                victim = Global.users[Global.arena[attackingUser.location[0]][attackingUser.location[1] + 1]];
                break;
              case "left":
                //if (Global.users[Global.arena[attackingUser.location[0] - 1]]) {
                victim = Global.users[Global.arena[attackingUser.location[0] - 1][attackingUser.location[1]]];
                //}
                break;
              case "right":
                //if (Global.users[Global.arena[attackingUser.location[0] + 1]]) {
                victim = Global.users[Global.arena[attackingUser.location[0] + 1][attackingUser.location[1]]];
                //}
                break;
            }
          }
        } catch (e) {
          utils.sendConsole('oops');
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

      // checks for json here
      console.log('[RECV] ' + message.utf8Data);
      //connection.sendUTF(message.utf8Data + ' received!');
    }
    else if (message.type === 'binary') {
      console.log('[RECV] Binary: ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });
  connection.on('close', function(reasonCode, description) {
    console.log('[INFO] ' + connection.remoteAddress + ' disconnected.');
    if(Global.users[connection.uuid]) Global.users[connection.uuid].destroy();
  });
});