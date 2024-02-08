const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  async execute(ctx) {
    ctx.user.setActivity("UNO in Discord!");
    console.log(`Logged in as ${ctx.user.tag}`);
  },
};
