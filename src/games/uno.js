const fs = require("fs");
const { uno_deck } = require("./static.json");
const { ChannelType } = require("discord.js");

function print_card(card) {
  if (card.type == "number" && card.color != "wild") {
    return card.color[0] + card.number;
  } else if (card.type == "draw" && card.color == "wild") {
    return card.color + card.type
  } else if (card.number == -1 && card.color == "wild") {
    return card.color;
  } else {
    return card.color + card.type;
  }
}

function draw_card(amt, hand, deck) {
  for (let i = 0; i < amt; i++) {
    const card = Math.floor(Math.random() * deck.length);
    hand.push(deck[card]);
    deck.splice(card, 1);
  }
  return hand;
}

async function show_current_card(game) {
  var card = print_card(game.current_card);
  if (game.current_card.number == -2) {
    card = `wild ${game.current_card.color}`;
  }
  const currentPlayerDiscord = await game.guild.members.fetch(
    game.players[game.current_turn].id
  );
  await game.channel.send(
    `# New Turn\n## Current Card:\n\`${card}\`\n## Current Player:\n${currentPlayerDiscord.toString()}`
  );
}

async function show_hands(game, definedPlayer = undefined) {
  game.players
    .filter(
      (player) => definedPlayer == undefined || player.id == definedPlayer.id
    )
    .forEach(async (player) => {
      let message = "Current Cards:\n";
      player.hand.forEach((card) => {
        message += `\`${print_card(card)}\` `;
      });
      await player.thread.send(message);
    });
}

async function sent_thread_cmd(game, message) {
  const player = game.players.filter(
    (player) =>
      player.id == message.author.id &&
      player.thread.id == message.channel.id &&
      game.current_turn == game.players.indexOf(player)
  )[0];
  if (message.content == "draw") {
    var hand = draw_card(1, player.hand, game.deck);
    hand
      .filter((card) => !player.hand.includes(card))
      .forEach((card) => {
        game.deck.splice(hand.indexOf(card), 1);
      });
    player.hand = hand;
    await show_hands(game, player);
  } else;
  const cards = player.hand.filter(
    (card) => message.content.startsWith(print_card(card))
  );
  const card = cards.filter(
    (card) =>
      card.color == game.current_card.color ||
      card.number == game.current_card.number ||
      card.color == "wild" ||
      game.current_card.color == "wild"
  )[0];
  if (card == null) return;
  if (card.color == "wild") {
    card.number = -2;
    if (message.content.endsWith("red")) {
      card.color = "red";
    } else if (message.content.endsWith("yellow")) {
      card.color = "yellow";
    } else if (message.content.endsWith("green")) {
      card.color = "green";
    } else if (message.content.endsWith("blue")) {
      card.color = "blue";
    } else return;
    if (card.type == "draw") {
      var next_player = game.current_turn;
      if (next_player + 1 < game.players.length) {
        next_player += 1;
      } else {
        next_player = 0;
      }
      var hand = draw_card(2, game.players[next_player].hand, game.deck);
      hand
        .filter((card) => !game.players[next_player].hand.includes(card))
        .forEach((card) => {
          game.deck.splice(hand.indexOf(card), 1);
        });
      game.players[next_player].hand = hand;
      game.current_turn = next_player;
    }
  }
  switch (card.type) {
    case "skip":
      if (game.current_turn + 1 < game.players.length) {
        game.current_turn += 1;
      } else {
        game.current_turn = 0;
      }
      break;
    case "reverse":
      game.players.reverse();
      break;
    case "draw":
      var next_player = game.current_turn;
      if (next_player + 1 < game.players.length) {
        next_player += 1;
      } else {
        next_player = 0;
      }
      var hand = draw_card(2, game.players[next_player].hand, game.deck);
      hand
        .filter((card) => !game.players[next_player].hand.includes(card))
        .forEach((card) => {
          game.deck.splice(hand.indexOf(card), 1);
        });
      game.players[next_player].hand = hand;
      game.current_turn = next_player;
      break;
  }
  game.current_card = card;
  player.hand.splice(player.hand.indexOf(card), 1);
  if (game.current_turn + 1 < game.players.length) {
    game.current_turn += 1;
  } else {
    game.current_turn = 0;
  }
  await show_hands(game);
  await show_current_card(game);
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
      current_turn: 0,
      guild: lobby.guild,
      reversed: false,
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
      var hand = draw_card(7, [], game.deck);
      hand
        .filter((card) => !new_player.hand.includes(card))
        .forEach((card) => {
          game.deck.splice(hand.indexOf(card), 1);
        });
      new_player.hand = hand;
      game.players.push(new_player);
    }
    const card = Math.floor(Math.random() * game.deck.length);
    game.current_card = game.deck[card];
    game.deck.splice(card, 1);
    var activeGames = JSON.parse(
      fs.readFileSync("./src/active-games.json").toString()
    );
    activeGames.uno[game.id] = game;
    fs.writeFileSync(
      "./src/active-games.json",
      JSON.stringify(activeGames, "", 2)
    );
    await show_hands(game);
    await show_current_card(game);
    for (player of game.players) {
      player.thread
        .createMessageCollector({ filter: (m) => !m.author.bot })
        .on("collect", (m) => sent_thread_cmd(game, m));
    }
  },
};
