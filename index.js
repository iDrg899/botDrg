const {Discord, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Client, Collection} = require('discord.js');

const client = new Client({
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

client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  client.commands.set(command.name, command);
}

function isArrayInArray(arr, item){
  var item_as_string = JSON.stringify(item);

  var contains = arr.some(function(ele){
    return JSON.stringify(ele) === item_as_string;
  });
  return contains;
}

function indexOfArrayInArray(arr, item) {
  for (let i = 0; i < arr.length; i++) {
    let compared = arr[i];
    if (compared.length != item.length) {
      continue;
    }

    let equal = true;
    for (let j = 0; j < item.length; j++) {
      if (!compared[j].isEqualTo(item[j])) {
        equal = false;
        break;
      }
    }

    if (equal) {
      return i;
    }
  }

  return -1;
}

// const defaultDeckType = "shuffled";
const defaultDeckType = "seeded";
// const defaultDeckType = "unshuffled";
const SUITS = ["S", "H", "D", "C", "J"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "B", "R"];

class Player {
  constructor(username) {
    this.username = username;
    this.hand = [];
  }

  remove(card) {
    let handSize = this.hand.length;
    this.hand = this.hand.filter(c => !c.isEqualTo(card));

    if (this.hand.length < handSize) {
      return "successful removal";
    } else {
      return "failed removal";
    }
  }

  getRandomCard() {
    return this.hand[Math.floor(Math.random() * (this.hand.length))];
  }

  hasCard(card) {
    for (let i = 0; i < this.hand.length; i++) {
      if (card.isEqualTo(this.hand[i])) {
        return true;
      }
    }

    return false;
  }
}

/* Card class */
class Card {
  constructor(suit, value) {
    if (SUITS.includes(suit)) {
      if (VALUES.includes(value)) {
        this.suit = suit;
        this.value = value;
      } else {
        console.log("Error! Value bad!");
      }
    } else {
      console.log("Error! Suit bad!");
    }
  }

  isEqualTo(card) {
    return (this.suit === card.suit && this.value === card.value);
  }

  isLessThan(card) {
    if (SUITS.indexOf(this.suit) < SUITS.indexOf(card.suit)) {
      return true;
    } else if (SUITS.indexOf(this.suit) === SUITS.indexOf(card.suit) && VALUES.indexOf(this.value) < VALUES.indexOf(card.value)) {
      return true;
    }
    return false;
  }

  getOwnerFrom(playerList) {
    for (let i = 0; i < playerList.length; i++) {
      for (let j = 0; j < playerList[i].hand.length; j++) {
        if (this.isEqualTo(playerList[i].hand[j])) {
          return playerList[i];
        }
      }
    }
    console.log("There is a card that no player owns.")
    return -1;
  }

  getHalfSuitIndex() {
    for (let i = 0; i < HALFSUITS.length; i++) {
      for (let j = 0; j < HALFSUITS[i].length; j++) {
        if (this.isEqualTo(HALFSUITS[i][j])) {
          return i;
        }
      }
    }

    return -1;
  }
}

const HALFSUITS = [
  [new Card("S", "2"), new Card("S", "3"), new Card("S", "4"), new Card("S", "5"), new Card("S", "6"), new Card("S", "7")],
  [new Card("S", "9"), new Card("S", "10"), new Card("S", "J"), new Card("S", "Q"), new Card("S", "K"), new Card("S", "A")],
  [new Card("H", "2"), new Card("H", "3"), new Card("H", "4"), new Card("H", "5"), new Card("H", "6"), new Card("H", "7")],
  [new Card("H", "9"), new Card("H", "10"), new Card("H", "J"), new Card("H", "Q"), new Card("H", "K"), new Card("H", "A")],
  [new Card("D", "2"), new Card("D", "3"), new Card("D", "4"), new Card("D", "5"), new Card("D", "6"), new Card("D", "7")],
  [new Card("D", "9"), new Card("D", "10"), new Card("D", "J"), new Card("D", "Q"), new Card("D", "K"), new Card("D", "A")],
  [new Card("C", "2"), new Card("C", "3"), new Card("C", "4"), new Card("C", "5"), new Card("C", "6"), new Card("C", "7")],
  [new Card("C", "9"), new Card("C", "10"), new Card("C", "J"), new Card("C", "Q"), new Card("C", "K"), new Card("C", "A")],
  [new Card("S", "8"), new Card("H", "8"), new Card("D", "8"), new Card("C", "8"), new Card("J", "B"), new Card("J", "R")],
];

/* Deck class */
class Deck {
  constructor(type = "unshuffled") {
    let cards = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 13; j++) {
        cards.push(new Card(SUITS[i], VALUES[j]));
      }
    }
    cards.push(new Card("J", "B"));
    cards.push(new Card("J", "R"));
    this.cards = cards;

    if (type === "shuffled") {
      this.shuffle()
    }

    if (type === "seeded") {
      let tmp = this.cards[20]
      this.cards[20] = this.cards[21];
      this.cards[21] = tmp;
      tmp = this.cards[46]
      this.cards[46] = this.cards[47];
      this.cards[47] = tmp;
      tmp = this.cards[52]
      this.cards[52] = this.cards[1];
      this.cards[1] = tmp;
    }
  }

  shuffle() {
    for (let i = this.cards.length-1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i+1));

      let tmp = this.cards[i];
      this.cards[i] = this.cards[j];
      this.cards[j] = tmp;
    }
  }

  dealCard() {
    return this.cards.pop();
  }

  isEmpty() {
    return (this.cards.length == 0);
  }
}

// Beginning of Fish BS
class Fish {
  constructor(players) {
    let deck = new Deck(defaultDeckType);
    this.table = players; // Change this later to customize order

    this.team1 = [this.table[0], this.table[2], this.table[4]];
    this.team2 = [this.table[1], this.table[3], this.table[5]];

    let dealingIdx = 0;
    while (!deck.isEmpty()) {
      this.table[dealingIdx % 6].hand.push(deck.dealCard());
      dealingIdx++;
    }

    this.halfSuitStatus = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  getTeamOf(player) {
    if (this.team1.includes(player)) {
      return 1;
    } else {
      return 2;
    }
  }

  declare(declarer, cardList, playerList) {
    for (let i = 0; i < playerList.length; i++) {
      if (this.getTeamOf(declarer) !== this.getTeamOf(playerList[i])) {
        console.log("Man, you can't tell them what they have.");
        return;
      }
    }

    let copy = [...cardList];
    // Sort cardList.
    for (let i = 0; i < cardList.length; i++) {
      let mindex = i;
      for (let j = i; j < cardList.length; j++) {
        if (cardList[j].isLessThan(cardList[mindex])) {
          mindex = j;
        }
      }
      let tmp = cardList[mindex];
      cardList[mindex] = cardList[i];
      cardList[i] = tmp;
    }

    // Check if half suit is good.
    if (isArrayInArray(HALFSUITS, cardList)) {
      console.log("Good half suit");
    } else {
      console.log("BAD hald suit!!!");
      // TODO: tell user to put in better half suit
      return;
    }

    let sameTeam = true;
    let badGuess = false;
    // Check if player guesses are correct.
    for (let i = 0; i < copy.length; i++) {
      console.log(copy[i].getOwnerFrom(this.table).username)
      console.log(playerList[i].username)
      if (copy[i].getOwnerFrom(this.table) !== playerList[i]) {
        console.log("Player guess wrong!!!")
        badGuess = true;
        if (this.getTeamOf(declarer) !== this.getTeamOf(copy[i].getOwnerFrom(this.table))) {
          sameTeam = false;
        }
      }
    }

    for (let i = 0; i < cardList.length; i++) {
      cardList[i].getOwnerFrom(this.table).remove(cardList[i]);
    }

    if (badGuess) {
      if (sameTeam) {
        this.halfSuitStatus[indexOfArrayInArray(HALFSUITS, cardList)] = -1;
      } else {
        this.halfSuitStatus[indexOfArrayInArray(HALFSUITS, cardList)] = 3 - this.getTeamOf(declarer);
      } 
    } else {
      this.halfSuitStatus[indexOfArrayInArray(HALFSUITS, cardList)] = this.getTeamOf(declarer);
    }
  }

  burn(giver, recipient) {
    let card = giver.getRandomCard();
    giver.remove(card);
    recipient.hand.push(card);
  }

  ask(asker, asked, card) {
    if (this.getTeamOf(asker) === this.getTeamOf(asked)) {
      console.log("Can't ask team member.");
      // TODO: tell the kids that they can't ask their own team member
      return;
    }

    let legal = false;
    
    for (let i = 0; i < asker.hand.length; i++) {
      if (asker.hand[i].getHalfSuitIndex() == card.getHalfSuitIndex()) {
        legal = true;
      }
    }

    if (asker.hasCard(card)) {
      legal = false;
    }

    if (!legal) {
      console.log("Illegal move, burn baby burn.");
      this.burn(asker, asked);
      return;
    }

    let removalSuccess = asked.remove(card);

    if (removalSuccess == "successful removal") {
      asker.hand.push(card);
      console.log("successful ask");
    } else {
      console.log("you should've asked nicely.");
    }
  }
}

let playerList = [p1, p2, p3, p4, p5, p6] = [new Player("1"), new Player("2"), new Player("3"), new Player("4"), new Player("5"), new Player("@varghs")];
let fishGame = new Fish(playerList);
fishGame.declare(p1, [new Card("H", "8"), new Card("S", "8"), new Card("D", "8"), new Card("C", "8"), new Card("J", "B"), new Card("J", "R")], [p3, p5, p3, p1, p5, p1]);
console.log(fishGame.halfSuitStatus);
console.log(p1.hand)
console.log(p3.hand)
console.log(p5.hand)

fishGame.ask(p1, p2, new Card("C", "3"));
console.log(p2.hand);


client.once('ready', () =>  {
  console.log('botDrg is online!');
})

client.on("messageCreate", (message) => {
  if (message.content.includes("billy bob")) {
    message.channel.send("YEEHAW!")
  }

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
        message.author.send({content: 'Only you! :)', ephemeral: true});
      }
      break;
    case 'button':
      const button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("button").setLabel("Show Cards!").setStyle(ButtonStyle.Primary))
      const embed = new EmbedBuilder().setColor("Blue").setDescription(`Game has started; Please click to see your cards`)
      const embed2 = new EmbedBuilder().setColor("Blue").setDescription(`The button was pressed`)

      message.channel.send({embeds:[embed], components: [button]})

      const collector = message.channel.createMessageComponentCollector()
      collector.on("collect", async i => {
        // console.log(i)
      })
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  await interaction.reply({
    content: 'This is an ephemeral message!',
    ephemeral: true,
  });

  console.log("TEST")
});

client.login('MTEyMDUxMTY1NDE5OTgyODU1Mg.GRKEVP.UJU3DHtQyuCan7G0AmmH4Fa2Z1HtroPDhYnYAk');

// client.api.interactions(this.id, this.token).callback.post( {data: { type: 4, data: {flags:64, content: message}}  }))
