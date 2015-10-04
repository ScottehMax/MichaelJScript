var Global = {
    leaderboard: [],
    users: {},
    console: false,
    powerup: [],
    poweruptype: []
};

Global.arena = new Array(20);
for (var i = 0; i < 20; i++) {
  Global.arena[i] = new Array(20);
  Global.arena[i].fill(false);
}


module.exports = Global;