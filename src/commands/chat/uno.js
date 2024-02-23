const fs = require("fs");
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
  Events,
} = require("discord.js");
const { start_game } = require("../../games/uno");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("uno")
    .setDescription("UNO Related Commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("new_game")
        .setDescription("Create a New UNO Game")
        .addIntegerOption((option) =>
          option
            .setName("timer")
            .setDescription(
              "How Long Before the Lobby Expires in seconds (Default 10 Minutes)"
            )
            .setRequired(false)
        )
    ),
  async new_game(ctx, timer) {
    var embed = new EmbedBuilder()
      .setAuthor({
        name: ctx.user.displayName,
        iconURL: ctx.user.displayAvatarURL(),
      })
      .setTitle("New UNO Game!")
      .setDescription(`${ctx.user.toString()} wants to start an UNO Game!`)
      .setTimestamp(new Date(Date.now()))
      .addFields(
        { name: "Player List", value: ctx.user.toString() },
        {
          name: "Expiration",
          value: `Lobby Expires <t:${Math.floor(Date.now() / 1000 + timer)}:R>`,
        }
      );
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("join_button")
        .setLabel("Join Game")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("leave_button")
        .setLabel("Leave Game")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("start_button")
        .setLabel("Start Game")
        .setStyle(ButtonStyle.Primary)
    );
    await ctx.reply({
      content: "New Game Created!",
      ephemeral: true,
    });
    const lobby = await ctx.channel.send({
      embeds: [embed],
      components: [buttons],
    });
    const collector = lobby.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: timer * 1_000,
    });
    collector.on("collect", async (lobby_ctx) => {
      if (lobby_ctx.customId === "join_button") {
        if (!embed.data.fields[0].value.includes(lobby_ctx.user.toString())) {
          const value = `${
            embed.data.fields[0].value
          }\n${lobby_ctx.user.toString()}`;
          embed.spliceFields(0, 1, { name: "Player List", value: value });
          await lobby.edit({ embeds: [embed] });
          await lobby_ctx.reply({
            content: "Successfully Joined Game!",
            ephemeral: true,
          });
        } else {
          await lobby_ctx.reply({
            content: "You are Already in this Game",
            ephemeral: true,
          });
        }
      } else if (lobby_ctx.customId === "leave_button") {
        if (lobby_ctx.user != ctx.user) {
          if (embed.data.fields[0].value.includes(lobby_ctx.user.toString())) {
            const prevalue = embed.data.fields[0].value.split(
              lobby_ctx.user.toString()
            );
            const value = `${prevalue[0]}\n${prevalue[1]}`;
            embed.spliceFields(0, 1, { name: "Player List", value: value });
            await lobby.edit({ embeds: [embed] });
            await lobby_ctx.reply({
              content: "Successfully Left Game!",
              ephemeral: true,
            });
          } else {
            await lobby_ctx.reply({
              content: "You are Not in this Game",
              ephemeral: true,
            });
          }
        } else {
          await lobby_ctx.reply({
            content: "You can't leave a game you created",
            ephemeral: true,
          });
        }
      } else if (lobby_ctx.customId === "start_button") {
        if (lobby_ctx.user == ctx.user) {
          await lobby_ctx.reply("Starting Game...");
          collector.stop();
          await start_game(lobby, ctx.user);
        } else {
          await lobby_ctx.reply({
            content: "You did not Create this Game",
            ephemeral: true,
          });
        }
      }
    });
  },
  async execute(ctx) {
    const configFile = JSON.parse(
      fs.readFileSync("./src/config.json").toString()
    );
    if (
      configFile.guildSettings[ctx.guild.id] &&
      configFile.guildSettings[ctx.guild.id].uno_category &&
      configFile.guildSettings[ctx.guild.id].uno_archive_category &&
      configFile.guildSettings[ctx.guild.id].game_end_delay
    ) {
      const subcommand = ctx.options.getSubcommand();
      if (subcommand === "new_game") {
        var timer = ctx.options.getInteger("timer");
        if (!timer) {
          timer = 600;
        } else if (timer > 21600) {
          ctx.reply({
            content:
              "Please Select an amount less than `6 Hours (21600 Seconds)`",
            ephemeral: true,
          });
          return;
        }
        this.new_game(ctx, timer);
      }
    } else {
      await ctx.reply({
        content:
          "This bot has not been set up yet, please contact the owner to have them configure it",
        ephemeral: true,
      });
    }
  },
};
