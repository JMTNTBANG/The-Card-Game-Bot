const fs = require("fs");
const { uno_deck } = require("./static.json");
const { ChannelType, ThreadAutoArchiveDuration } = require("discord.js");

async function show_hands(game) {
  for (player of game.players) {
    let message = "Current Cards:\n";
    for (card of player.hand) {
      if (card.type == "number" && card.color != "wild") {
        message += `\`${card.color[0]}${card.number}\` `;
      } else if (card.number == -1 && card.color == "wild") {
        message += `\`${card.color}\` `;
      } else {
        message += `\`${card.color} ${card.type}\` `;
      }
    }
    await player.thread.send(message);
  }
}

module.exports = {
  async start_game(lobby, owner) {
    const configFile = JSON.parse(fs.readFileSync("./src/config.json"));
    const guildSettings = configFile.guildSettings[lobby.guild.id];
    const game = {
      id: lobby.guild.id + "-" + Date.now(),
      owner: owner.id,
      players: [],
      deck: uno_deck,
      channel: await lobby.guild.channels.create({
        name: `${owner.displayName}s Game`,
        type: ChannelType.GuildText,
        parent: guildSettings.uno_category,
      }),
    };
    for (player of lobby.embeds[0].data.fields[0].value.split("\n")) {
      const playerDiscord = await lobby.guild.members.fetch(
        player.slice(2, -1)
      );
      const new_player = {
        id: player.slice(2, -1),
        hand: [],
        thread: await game.channel.threads.create({
          name: playerDiscord.displayName,
          type: ChannelType.PrivateThread,
        }),
      };
      new_player.thread.send(`<@${new_player.id}>`);
      for (let i = 0; i < 7; i++) {
        const card = Math.floor(Math.random() * game.deck.length);
        new_player.hand.push(game.deck[card]);
        game.deck.splice(card, 1);
      }
      game.players.push(new_player);
    }
    var activeGames = JSON.parse(
      fs.readFileSync("./src/active-games.json").toString()
    );
    activeGames.uno[game.id] = game;
    fs.writeFileSync(
      "./src/active-games.json",
      JSON.stringify(activeGames, "", 2)
    );
    await show_hands(game);
  },
};
