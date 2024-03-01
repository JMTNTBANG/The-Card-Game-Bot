const fs = require("fs");
const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure the Bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("uno_category")
        .setDescription("The Category where UNO games will be held")
        .addStringOption((option) =>
          option
            .setName("category_id")
            .setDescription(
              'The Category ID (Right click the category and "Copy Channel ID"'
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("uno_archive_category")
        .setDescription("The Category Where Archived Games will be saved")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription(
              "Whether the bot should Archive finished games or not (Put in the category ID if true)"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("category_id")
            .setDescription(
              'The Category ID (Right click the category and "Copy Channel ID"'
            )
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("game_end_delay")
        .setDescription(
          "How Long After a Game end that it will be Archived/Deleted (Default 5 Minutes)"
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("Duration in Seconds")
            .setRequired(true)
        )
    ),
  async uno_category(ctx, category) {
    const channel = await ctx.client.channels.fetch(category);
    if (channel.type == ChannelType.GuildCategory) {
      var configFile = JSON.parse(
        fs.readFileSync("./src/config.json").toString()
      );
      if (!configFile.guildSettings[ctx.guild.id]) {
        configFile.guildSettings[ctx.guild.id] = {};
      }
      configFile.guildSettings[ctx.guild.id]["uno_category"] = category;
      fs.writeFileSync("./src/config.json", JSON.stringify(configFile, "", 2));
      await ctx.reply({
        content: `Successfully Set \`${channel.name}\` as your UNO Category!`,
        ephemeral: true,
      });
    } else {
      ctx.reply({ content: "Not a Category Channel", ephemeral: true });
    }
  },
  async uno_archive_category(ctx, enabled, category) {
    var configFile = JSON.parse(
      fs.readFileSync("./src/config.json").toString()
    );
    var reply = "";
    if (enabled) {
      if (category != null) {
        var channel = await ctx.client.channels.fetch(category);
        if (channel.type == ChannelType.GuildCategory) {
          configFile.guildSettings[ctx.guild.id]["uno_archive_category"] =
            category;
          reply = `Successfully Set \`${channel.name}\` as your UNO Archive Category!`;
        } else {
          reply = "Not a Category Channel";
        }
      } else {
        reply = "Please Specify a Category ID";
      }
    } else {
      configFile.guildSettings[ctx.guild.id]["uno_archive_category"] = null;
      reply = "Successfully Disabled Game Archival";
    }
    fs.writeFileSync("./src/config.json", JSON.stringify(configFile, "", 2));
    await ctx.reply({
      content: reply,
      ephemeral: true,
    });
  },
  async game_end_delay(ctx, duration) {
    if (duration < 0) {
      ctx.reply({
        content: "Please Choose a Positive Number",
        ephemeral: true,
      });
      return;
    }
    var configFile = JSON.parse(
      fs.readFileSync("./src/config.json").toString()
    );
    configFile.guildSettings[ctx.guild.id]["game_end_delay"] = duration;
    ctx.reply({
      content: `Successfully Changed the Game End Delay to \`${duration} seconds\``,
      ephemeral: true,
    });
    fs.writeFileSync("./src/config.json", JSON.stringify(configFile, "", 2));
  },
  async execute(ctx) {
    var configFile = JSON.parse(
      fs.readFileSync("./src/config.json").toString()
    );
    if (!configFile.guildSettings[ctx.guild.id]) {
      configFile.guildSettings[ctx.guild.id] = { game_end_delay: 300 };
      fs.writeFileSync("./src/config.json", JSON.stringify(configFile, "", 2));
    }
    const subcommand = ctx.options.getSubcommand();
    if (subcommand === "uno_category") {
      this.uno_category(ctx, ctx.options.getString("category_id"));
    } else if (subcommand === "uno_archive_category") {
      this.uno_archive_category(
        ctx,
        ctx.options.getBoolean("enabled"),
        ctx.options.getString("category_id")
      );
    } else if (subcommand === "game_end_delay") {
      this.game_end_delay(ctx, ctx.options.getInteger("duration"));
    }
  },
};
