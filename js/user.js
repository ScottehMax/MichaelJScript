var utils = require('./utils.js');
var Global = require('./global.js')

function User(socket) {
    // User class. Constructor sets all variables and associates the object with the socket.
    this.socket = socket;
    this.uuid = utils.uuid();

    Global.users[this.uuid] = this;

    this.health = 4;
    this.score = 0;
}

User.prototype.set_info = function (name, job) {
    console.log("setting user with UUID " + this.uuid + " info")
    this.name = name;
    console.log("setting name to " + name);
    this.job = job;
    console.log("setting job to " + job);

    console.log(this);

    this.location = [utils.randint(0, 20), utils.randint(0, 20)];
}

User.prototype.reset = function () {
    // R.I.P.
    this.set_leaderboard();

    this.health = 4;
    this.score = 0;
}

User.prototype.set_leaderboard = function () {
    Global.leaderboard.push([this.name, this.score]);
    Global.leaderboard.sort(function(a, b){ return b[1]-a[1]; });
    Global.leaderboard = Global.leaderboard.slice(0, 10);
}

User.prototype.destroy = function () {
    delete Global.users[this.uuid];
    console.log(this.uuid + " destroyed.");
}

exports.User = User;