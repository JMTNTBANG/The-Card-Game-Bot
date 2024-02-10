const fs = require("fs");
const { uno_deck } = require("./static.json");

function generate_hand(deck) {
  return hand, deck;
}
module.exports = {
  async start_game(lobby, owner) {
    const game = {
      id: Date.now(),
      owner: owner,
      players: [],
      deck: uno_deck,
    };
    for (player of lobby.embeds[0].data.fields[0].value.split("\n")) {
      const new_player = {
        id: player.slice(2, -1),
        hand: [],
      };
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
    activeGames.uno[game.id] = game
    fs.writeFileSync("./src/active-games.json", JSON.stringify(activeGames, "", 2));
  },
};
