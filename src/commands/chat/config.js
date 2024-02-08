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
  async execute(ctx) {
    const subcommand = ctx.options.getSubcommand();
    if (subcommand === "uno_category") {
      this.uno_category(ctx, ctx.options.getString("category_id"));
    }
  },
};
