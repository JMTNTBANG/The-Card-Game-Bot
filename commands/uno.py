import bot
import functions
import discord

def import_command():

    unoCommands = discord.app_commands.Group(
        name='uno',
        description='uno'
    )
    bot.commands.add_command(unoCommands)

    @unoCommands.command(
        name='start',
        description='Start UNO Game'
    )
    async def self(interaction: discord.Interaction):
        if await functions.checkPerms(interaction.guild):
            await interaction.response.send_message('React with 👍 to start game',ephemeral=True)
            message = await interaction.channel.send(embed=discord.Embed(title=f'{interaction.user.name} would like to start an UNO Game', description='React Below to join'))
            await message.add_reaction('✅')
            bot.pendingUNOgames.append(functions.unoGame.pending(message, interaction.user,interaction.guild))
        else:
            await interaction.response.send_message(f'Please Contact {interaction.guild.owner.mention} to give the bot the correct permissions', ephemeral=True)