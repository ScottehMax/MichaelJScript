var utils = require('./utils.js');
var Global = require('./global.js')

function User(socket) {
    // User class. Constructor sets all variables and associates the object with the socket.
    this.socket = socket;
    this.uuid = utils.uuid();

    Global.users[this.uuid] = this;

    this.health = 4;
    this.score = 0;

    this.location = [utils.randint(0, 20), utils.randint(0, 20)];
}

User.prototype.reset = function () {
    // R.I.P.
    do_leaderboard_check(); // still not done you lazy bum

    this.health = 4;
    this.score = 0;
}

User.prototype.leaderboard = function () {
    // TODO
}

exports.User = User;