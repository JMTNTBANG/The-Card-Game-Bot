const fs = require("fs");
const { uno_deck } = require("./static.json");
const { ChannelType } = require("discord.js");
const { assets } = require("../config.json");

function print_card(card, text = false) {
  if (card.type == "number" && card.color != "wild") {
    var colorAsset = assets.uno.colors[card.color];
    var numberAsset = assets.uno.numbers[card.number];
    if (text) {
      colorAsset = card.color[0];
      numberAsset = card.number;
    }
    return { row1: colorAsset, row2: numberAsset };
  } else if (card.type == "draw" && card.color == "wild") {
    var colorAsset = assets.uno.colors[card.color];
    var numberAsset = assets.uno.special["draw4"];
    if (text) {
      colorAsset = card.color;
      numberAsset = card.type;
    }
    return { row1: colorAsset, row2: numberAsset };
  } else if (card.number == -1 && card.color == "wild") {
    var colorAsset = assets.uno.colors[card.color];
    var numberAsset = assets.uno.special["blank"];
    if (text) {
      colorAsset = card.color;
      numberAsset = "";
    }
    return { row1: colorAsset, row2: numberAsset };
  } else if (card.number == -2) {
    const colorAsset = assets.uno.colors[card.color];
    var numberAsset = assets.uno.special["blank"];
    if (card.type == "draw") {
      numberAsset = assets.uno.special["draw4"];
    }
    return { row1: colorAsset, row2: numberAsset };
  } else {
    var colorAsset = assets.uno.colors[card.color];
    var numberAsset = assets.uno.special[card.type];
    if (text) {
      colorAsset = card.color;
      numberAsset = card.type;
    }
    return { row1: colorAsset, row2: numberAsset };
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
  const winner = game.players.filter((player) => player.hand.length == 0)[0];
  var card = print_card(game.current_card);
  const currentPlayerDiscord = await game.guild.members.fetch(
    game.players[game.current_turn].id
  );
  await game.channel.send(`# New Turn\n## Current Card:`);
  await game.channel.send(`${card.row1}\n${card.row2}`);
  await game.channel.send(
    `## Current Player:\n${currentPlayerDiscord.toString()}`
  );
  game.card_counter = await game.channel.send(
    `\`Current Player has ${
      game.players[game.current_turn].hand.length
    } Cards\``
  );
  if (winner != null) {
    var configFile = JSON.parse(
      fs.readFileSync("./src/config.json").toString()
    );
    await game.channel.send(`# <@${winner.id}> Wins!!`);
    game.msgCollector.stop();
    for (player of game.players) {
      player.msgCollector.stop();
    }
    setTimeout(function () {
      if (game.archive != null) {
        game.channel.edit({ name: `uno-${game.id}`, parent: game.archive });
      } else {
        game.channel.delete({ reason: "Game End" });
      }
    }, configFile.guildSettings[game.guild.id].game_end_delay * 1000);
  }
}

async function show_hands(game, definedPlayer = undefined) {
  game.players
    .filter(
      (player) => definedPlayer == undefined || player.id == definedPlayer.id
    )
    .forEach(async (player) => {
      await player.thread.send("Current Cards:");
      let message = "";
      let row1 = "";
      let row2 = "";
      let i = 0;
      player.hand.forEach((card) => {
        if (i == 5) {
          message += `${row1}\n${row2}\n`;
          row1 = "";
          row2 = "";
          i = 0;
        }
        const cardObj = print_card(card);
        row1 += `${cardObj.row1} `;
        row2 += `${cardObj.row2} `;
        i++;
      });
      message += `${row1}\n${row2}\n`;
      await player.thread.send(message);
    });
}

async function sent_game_cmd(game, message) {
  const player = game.players.filter(
    (player) => player.id == message.author.id
  )[0];
  if (message.content == "uno") {
    if (game.players[game.last_player].hand.length == 1) {
      if (player == game.players[game.last_player]) {
        player.said_uno = true;
        await game.channel.send(`You Are Safe`);
      } else if (game.players[game.last_player].said_uno == false) {
        await game.channel.send(`Someone else beat you to it! Draw 2 Cards`);
        var hand = draw_card(2, game.players[game.last_player].hand, game.deck);
        hand
          .filter((card) => !game.players[game.last_player].hand.includes(card))
          .forEach((card) => {
            game.deck.splice(hand.indexOf(card), 1);
          });
        game.players[game.last_player].hand = hand;
        await show_hands(game, game.players[game.last_player]);
      }
    }
  }
}

async function sent_thread_cmd(game, message) {
  if (game.deck.length == 0) {
    game.deck = uno_deck;
  }
  const player = game.players.filter(
    (player) =>
      player.id == message.author.id &&
      player.thread.id == message.channel.id &&
      game.current_turn == game.players.indexOf(player)
  )[0];
  if (player == null) return;
  if (message.content == "draw") {
    var hand = draw_card(1, player.hand, game.deck);
    hand
      .filter((card) => !player.hand.includes(card))
      .forEach((card) => {
        game.deck.splice(hand.indexOf(card), 1);
      });
    player.hand = hand;
    player.said_uno = false;
    await show_hands(game, player);
    game.card_counter.edit(
      `\`Current Player has ${player.hand.length} Cards\``
    );
  } else;
  const cards = player.hand.filter((card) =>
    message.content.startsWith(
      print_card(card, true).row1 + print_card(card, true).row2
    )
  );
  const card = cards.filter(
    (card) =>
      card.color == game.current_card.color ||
      (card.number == game.current_card.number && card.number != -1) ||
      (card.type == game.current_card.type && card.number == -1) ||
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
      var cards_to_draw = 2;
      const draw_cards = game.players[next_player].hand.filter(
        (card) => card.type == "draw"
      );
      var skip_drawing = false;
      if (game.house_rules.stacking.enabled) {
        game.house_rules.stacking.current_stack += 2;
        skip_drawing = true;
        if (draw_cards == 0) {
          skip_drawing = false;
          cards_to_draw = game.house_rules.stacking.current_stack;
          game.house_rules.stacking.current_stack = 0;
        }
      }
      if (!skip_drawing) {
        var hand = draw_card(
          cards_to_draw,
          game.players[next_player].hand,
          game.deck
        );
        hand
          .filter((card) => !game.players[next_player].hand.includes(card))
          .forEach((card) => {
            game.deck.splice(hand.indexOf(card), 1);
          });
        game.players[next_player].hand = hand;
        game.players[next_player].said_uno = false;
      }
    }
  }
  game.last_player = game.current_turn;
  switch (card.type) {
    case "skip":
      if (game.current_turn + 1 < game.players.length) {
        game.current_turn += 1;
      } else {
        game.current_turn = 0;
      }
      break;
    case "reverse":
      const currentPlayer = game.players[game.current_turn];
      game.players.reverse();
      game.current_turn = game.players.indexOf(currentPlayer);
      break;
    case "draw":
      var next_player = game.current_turn;
      if (next_player + 1 < game.players.length) {
        next_player += 1;
      } else {
        next_player = 0;
      }
      var cards_to_draw = 2;
      const draw_cards = game.players[next_player].hand.filter(
        (card) => card.type == "draw"
      );
      var skip_drawing = false;
      if (game.house_rules.stacking.enabled) {
        game.house_rules.stacking.current_stack += 2;
        skip_drawing = true;
        if (draw_cards == 0) {
          skip_drawing = false;
          cards_to_draw = game.house_rules.stacking.current_stack;
          game.house_rules.stacking.current_stack = 0;
        }
      }
      if (!skip_drawing) {
        var hand = draw_card(
          cards_to_draw,
          game.players[next_player].hand,
          game.deck
        );
        hand
          .filter((card) => !game.players[next_player].hand.includes(card))
          .forEach((card) => {
            game.deck.splice(hand.indexOf(card), 1);
          });
        game.players[next_player].hand = hand;
        game.players[next_player].said_uno = false;
        game.current_turn = next_player;
      }
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
  if (game.house_rules.stacking.current_stack > 0) {
    await game.channel.send(`\`Current Stack at ${game.house_rules.stacking.current_stack}\``)
  }
}

module.exports = {
  async start_game(lobby, stacking_rule, owner) {
    const configFile = JSON.parse(fs.readFileSync("./src/config.json"));
    const guildSettings = configFile.guildSettings[lobby.guild.id];
    const game = {
      id: lobby.guild.id + "-" + Date.now(),
      owner: owner.id,
      players: [],
      deck: uno_deck,
      current_turn: 0,
      guild: lobby.guild,
      house_rules: {
        stacking: { enabled: stacking_rule, current_stack: 0 },
      },
      archive: guildSettings.uno_archive_category,
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
      new_player.thread.send(
        `<@${new_player.id}>\nList of In-Game Commands can be found [here](https://github.com/JMTNTBANG/The-Card-Game-Bot/wiki/UNO) `
      );
      var hand = draw_card(7, [], game.deck);
      hand
        .filter((card) => !new_player.hand.includes(card))
        .forEach((card) => {
          game.deck.splice(hand.indexOf(card), 1);
        });
      new_player.hand = hand;
      new_player.said_uno = false;
      game.players.push(new_player);
    }
    const card = Math.floor(Math.random() * game.deck.length);
    game.current_card = game.deck[card];
    game.deck.splice(card, 1);
    await show_hands(game);
    await show_current_card(game);
    for (player of game.players) {
      player.msgCollector = player.thread
        .createMessageCollector({ filter: (m) => !m.author.bot })
        .on("collect", (m) => sent_thread_cmd(game, m));
    }
    game.msgCollector = game.channel
      .createMessageCollector({ filter: (m) => !m.author.bot })
      .on("collect", (m) => sent_game_cmd(game, m));
  },
};
