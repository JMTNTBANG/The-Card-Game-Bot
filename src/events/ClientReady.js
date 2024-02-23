const { Events } = require("discord.js");
const { patreonToken, defaultStatus } = require("../config.json");
const { patreon } = require("patreon");
const patreonClient = patreon(patreonToken);

function patronsInStatus(ctx) {
  setInterval(function () {
  const statuses = [defaultStatus];
  patreonClient("/current_user/campaigns").then(async ({ store }) => {
    const campaign = store
      .findAll("campaign")
      .map((campaign) => campaign.serialize());
    patreonClient(
      `/campaigns/${campaign[0].data.id}/pledges?include=patron.null`
    ).then(async ({ store }) => {
      const pledges = store
        .findAll("campaign")
        .map((pledges) => pledges.serialize());
      if (pledges.included) {
        pledges.included.forEach((pledge) => {
          statuses.push(`Thanks ${pledge.attributes.full_name}!`);
        });
      }
    });
  });
    statuses.forEach((status) => {
      setTimeout(function () {
        ctx.user.setActivity({
          name: status,
        });
      }, 10_000);
    });
  }, 10_000);
}

module.exports = {
  name: Events.ClientReady,
  async execute(ctx) {
    patronsInStatus(ctx)
    console.log(`Logged in as ${ctx.user.tag}`);
  },
};
