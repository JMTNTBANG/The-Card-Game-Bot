import discord
from dotenv import load_dotenv
from os import getenv, listdir
import functions
import asyncio
import threading
import uno
import time

def start():

    ''' Get Token '''
    load_dotenv()
    TOKEN = getenv('TOKEN')
    if TOKEN is None:
        raise NameError('TOKEN is not defined in .env file')

    ''' Bot Intents '''
    botIntents = discord.Intents.default()
    botIntents.guilds = True
    botIntents.members = True
    botIntents.message_content = True

    ''' Client Variables '''
    global client
    global commands
    client = discord.Client(intents=botIntents)
    commands = discord.app_commands.CommandTree(client)

    ''' Dynamic Variables '''
    global commandList
    global emojis
    global pendingUNOgames
    global UNOGameCount
    commandList = []
    emojis = {}
    pendingUNOgames = []
    UNOGameCount = 0

    ''' Events '''
    @client.event
    async def on_ready():
        print('Running')
        
        ''' Set Bot Status '''
        await client.change_presence(activity=discord.Activity(type=discord.ActivityType.playing, name="card games"))
        print('Bot Presence changed to \"Playing card games\"')
        for guild in client.guilds:
            await functions.checkPerms(guild)
            await functions.checkForCategory(guild, 'UNO')
            await functions.checkForCategory(guild, 'UNO-ARCHIVE')

        ''' Load Commands '''
        for command in listdir('commands'):
            for command in listdir('commands'):
                if command.endswith('py'):
                    if '__init__.py' not in command:
                        if 'template.py' not in command:
                            if command not in commandList:
                                exec(f'import commands.{command[:-3]}')
                                exec(
                                    f'commands.{command[:-3]}.import_command()')
                                commandList.append(command)

        ''' Load Emojis '''
        for guild in client.guilds:
            for emoji in guild.emojis:
                emojis[f':{emoji.name}:'] = emoji

        ''' Sync Commands '''
        await commands.sync()

    @client.event
    async def on_guild_join(guild: discord.Guild):
        await functions.checkPerms(guild)
        await functions.checkForCategory(guild, 'UNO')
        await functions.checkForCategory(guild, 'UNO-ARCHIVE')  
        for channel in guild.channels:
            try:
                invite = await channel.create_invite(reason='Developer Debug')
                dm = await client.get_user(348935840501858306).create_dm()
                await dm.send(f'Bot Joined {invite.url}')
            except:
                pass
            else:
                break

    @client.event
    async def on_interaction(interaction):
        pass

    @client.event
    async def on_reaction_add(reaction: discord.Reaction, user: discord.User):
        for game in pendingUNOgames:
            if reaction.message == game.message and user == game.leader and reaction.emoji == '👍':
                pendingUNOgames.remove(game)
                await uno.startGame(client, reaction, game, emojis)

    @client.event
    async def on_message(message: discord.Message):
        if not message.author.bot:
            for guild in client.guilds:
                for category in guild.categories:
                    if category.name == 'UNO':
                        for channel in category.text_channels:
                            for thread in channel.threads:
                                if thread == message.channel:
                                    await uno.play(client, channel, message, emojis)
                                elif message.channel == thread.parent:
                                    if message.content.lower() == 'uno':
                                        await uno.sayUNO(client, channel, message)
                                    elif message.content.lower() == 'end':
                                        await uno.voteEnd(client, channel, message)

    ''' Deploy Bot '''
    client.run(TOKEN)