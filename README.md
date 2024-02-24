<center>
<img src="https://cdn.discordapp.com/avatars/1074903898910892043/036a5e747eb563ba7bce9d1c7fa4d3b3.webp"></img>
<h1>The Card Game Bot</h1>
</center>

# Setup
You can add the Discord bot to any server you own, just follow [this link](https://discord.com/oauth2/authorize?client_id=1074903898910892043&permissions=360777583632&scope=bot)

You will need to setup the bot upon adding it, just run the following configuration commands to get set up:
- `/config uno_category`
- `/config uno_archive_category`

Optional Config Commands are as follows:
- `/config game_end_delay` (Default 5 Minutes)'

After that the bot will be ready to go!

# Development
## Requirements
Will will need the following software installed:
1. [node.js v21.6.1](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
2. A JS IDE of your choice ([VS Code](https://code.visualstudio.com/) is suggested)

## Configuration
You will first need to create a Discord Bot in the [Discord Developer Portal](https://discord.com/developers)

Next You Will need to copy the config template at `./src/templates/config-template.json` and paste it as `./src/config.json`

Then Take The Discord Bot Token and paste it into the `"token"` value, same with the Application ID and `"clientId"` (Put `null` in the Patreon value if you have none)

Lastly you will need to run `npm i` to install all the Required Dependencies

It is also **__Highly Suggested__** to comment out lines `244-246` in `./node_modules/jsonapi-datastore/dist/node-jsonapi-datastore.js` as this block of code sends `Warning: Links not implemented yet.` to the console every few seconds

The Bot Should be ready for development now! VS Code configurations are built in the repository, but if you do not have VS Code, you can use the following NPM scripts:
- `npm run deploy` (Runs the bot)
- `npm run reload-commands` (Refreshes the / commands)

# Support
If you need any help at all, feel free to join the [Offical Server](https://discord.gg/Yk5DhefhnX)