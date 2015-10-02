function User(socket, name, class) {
    // User class. Constructor sets all variables and associates the object with the socket.
    this.name = name;
    this.socket = socket;
    this.class = class;

    this.uuid = uuid();

    users[this.uuid] = this;

    this.health = 4;
    this.score = 0;

    this.location = [randint(0, 20), randint(0, 20)];
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