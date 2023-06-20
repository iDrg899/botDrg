const Discord = require('discord.js');

const client = new Discord.Client({
    intents: [
        'Guilds',
        'GuildMembers',
        'GuildModeration',
        'GuildMessages',
        'GuildMessageReactions',
        'DirectMessageTyping',
        'MessageContent',
        'AutoModerationConfiguration',
        'AutoModerationExecution'
    ]
});

const prefix = '-';

const fs = require('fs');

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    client.commands.set(command.name, command);
}


// Beginning of Fish BS
class Fish {
    constructor(team1, team2) {
        this.team1 = team1;
        this.team2 = team2;
    }

    test(message) {
        message.channel.send('Fish tested!');
        console.log('Fish tested!');
    }
}

var fish = new Fish();
// End of Fish BS


client.once('ready', () =>  {
    console.log('botDrg is online!');
})

client.on('messageCreate', (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'ping':
            client.commands.get('ping').execute(message, args);
            break;
        case 'test1':
            client.commands.get('test1').execute(message, args);
            break;
        case 'fish':
            message.channel.send('Fish!');

            if (args[0] == 'begin') {
                fish = new Fish();
            } else if (args[0] == 'doch') {
                fish.test(message);
            } else if (args[0] == 'only') {
                message.reply({content: 'Only you! :)', ephemeral: true});
            }
            break;
    }
})

client.login('MTEyMDUxMTY1NDE5OTgyODU1Mg.GRKEVP.UJU3DHtQyuCan7G0AmmH4Fa2Z1HtroPDhYnYAk');

// client.api.interactions(this.id, this.token).callback.post( {data: { type: 4, data: {flags:64, content: message}}  }))