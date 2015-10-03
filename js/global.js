var Global = {
    leaderboard: [],
    users: {},
};

Global.arena = new Array(20);
for (var i = 0; i < 20; i++) {
  Global.arena[i] = new Array(20);
}

module.exports = Global;