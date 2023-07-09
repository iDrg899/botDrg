const { Discord, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Client, Collection, messageLink, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
require("dotenv").config()
const { exec } = require("child_process");

let startMenu;
let game;
let startMenuActionRow;
let random = false;

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

function isArrayInArray(arr, item) {
  var item_as_string = JSON.stringify(item);

  var contains = arr.some(function (ele) {
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
  constructor(id, username) {
    this.id = id;
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

  // Currently not used.
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

  isEqualTo(id) {
    return this.id == id
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
    console.log("There is a card that no player owns.");
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

  getName() {
    let name;

    switch (this.value) {
      case "A":
        name = "Ace of ";
        break;
      case "J":
        name = "Jack of ";
        break;
      case "Q":
        name = "Queen of ";
        break;
      case "K":
        name = "King of "
        break;
      case "B":
        name = "Black ";
        break;
      case "R":
        name = "Red ";
        break;
      default:
        name = this.value + " of ";
        break;
    }

    switch (this.suit) {
      case "S":
        name += "Spades";
        break;
      case "H":
        name += "Hearts";
        break;
      case "D":
        name += "Diamonds";
        break;
      case "C":
        name += "Clubs."
        break;
      case "J":
        name += "Joker."
        break;
    }

    return name;
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
    for (let i = this.cards.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));

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
  constructor(channel) {
    this.channel = channel;
    this.isSomebodySupposedToBurnRightNow = false;
    this.burnRecipient = null;

    this.table = []; // Change this later to customize order

    this.team1 = [];
    this.team2 = [];
    this.whoseTurn = null;
  }

  start() {
    for (let i = 0; i < 3; i++) {
      this.table.push(this.team1[i]);
      this.table.push(this.team2[i]);
    }

    this.whoseTurn = this.table[0];

    let deck = new Deck(defaultDeckType);
    let dealingIdx = 0;
    while (!deck.isEmpty()) {
      this.table[dealingIdx % 6].hand.push(deck.dealCard());
      dealingIdx++;
    }

    this.halfSuitStatus = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    showCards(this.channel)

    this.channel.send(`Game has started! <@${this.table[0].id}> make your move!`)
  }

  getTeamOf(player) {
    if (this.team1.includes(player)) {
      return 1;
    } else if (this.team2.includes(player)) {
      return 2;
    }
    return -1
  }

  addPlayer(player, team) {
    if (team == 1) {
      this.team1.push(player);
    }
    else {
      this.team2.push(player)
    }
  }

  removePlayer(id) {
    for (let i = 0; i < this.team1.length; i++) {
      if (this.team1[i].isEqualTo(id)) {
        this.team1.splice(i, 1)
      }
    }
    for (let i = 0; i < this.team2.length; i++) {
      if (this.team2[i].isEqualTo(id)) {
        this.team2.splice(i, 1)
      }
    }
  }

  setOrder() {

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
      console.log(copy[i].getOwnerFrom(this.table).id)
      console.log(playerList[i].id)
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

  burn(giver, card) {
    if (giver !== this.whoseTurn) {
      this.channel.send(`<@${giver.id}> It's not your turn. It's <@${this.whoseTurn.id}>'s turn.`);
      return;
    }

    if (!this.isSomebodySupposedToBurnRightNow) {
      this.channel.send(`<@${giver.id}> You don't need to burn right now.`);
      return;
    }

    if (giver !== card.getOwnerFrom(this.table)) {
      //TODO: remove next 2 lines
      console.log(giver);
      console.log(card.getOwnerFrom(this.table));

      this.channel.send(`<@${giver.id}> You do not own that card. Try again.`);
      return;
    }

    giver.remove(card);
    this.burnRecipient.hand.push(card);
    this.channel.send(`<@${giver.id}> burned the ${card.getName()} to <@${this.burnRecipient.id}>.`);
    this.isSomebodySupposedToBurnRightNow = false;
    this.whoseTurn = this.burnRecipient;
    this.burnRecipient = null;
  }

  ask(asker, asked, card) {
    if (this.isSomebodySupposedToBurnRightNow) {
      this.channel.send(`<@${asker.id}> That's not a burn, silly! BURN!!! (-fish burn <card>)`);
      return;
    }

    if (asker !== this.whoseTurn) {
      console.log("It's not your turn.");
      this.channel.send(`<@${asker.id}> It's not your turn. It's <@${this.whoseTurn.id}>'s turn.`);
      return;
    }

    if (this.getTeamOf(asker) === this.getTeamOf(asked)) {
      console.log("Can't ask team member.");
      this.channel.send("You can't asked your own team member. Try again.");
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
      this.channel.send(`<@${asker.id}> Illegal move, burn a card to <@${asked.id}> (-fish burn <card>).`)
      console.log("Illegal move, burn baby burn.");
      this.isSomebodySupposedToBurnRightNow = true;
      this.burnRecipient = asked;
      return;
    }

    let removalSuccess = asked.remove(card);

    if (removalSuccess == "successful removal") {
      asker.hand.push(card);
      console.log("successful ask");
      this.channel.send(`<@${asker.id}> successfully asked <@${asked.id}> for the ${card.getName()}.`);
    } else {
      console.log("you should've asked nicely.");
      this.whoseTurn = asked;
      this.channel.send(`<@${asker.id}> unsuccessfully asked <@${asked.id}> for the ${card.getName()}.`);
    }
  }

  printTeams() {
    this.channel.send(`Team 1: <@${this.team1[0].id}>, <@${this.team1[1].id}>, <@${this.team1[2].id}>`);
    this.channel.send(`Team 2: <@${this.team2[0].id}>, <@${this.team2[1].id}>, <@${this.team2[2].id}>`);
  }

  getPlayerFromId(id) {
    for (let i = 0; i < this.table.length; i++) {
      console.log(this.table[i].id);
      console.log(id);
      if (this.table[i].id === id) {
        return this.table[i];
      }
    }

    return -1;
  }
}

function cardToFile(card) {
  let ret = "cards/";
  switch (card.value) {
    case "A":
      ret += "ace_of";
      break;
    case "2":
      ret += "2_of";
      break;
    case "3":
      ret += "3_of";
      break;
    case "4":
      ret += "4_of";
      break;
    case "5":
      ret += "5_of";
      break;
    case "6":
      ret += "6_of";
      break;
    case "7":
      ret += "7_of";
      break;
    case "8":
      ret += "8_of";
      break;
    case "9":
      ret += "9_of";
      break;
    case "10":
      ret += "10_of";
      break;
    case "J":
      ret += "jack_of";
      break;
    case "Q":
      ret += "queen_of";
      break;
    case "K":
      ret += "king_of";
      break;
    case "B":
      ret += "black";
      break;
    case "R":
      ret += "red";
      break;
  }
  ret += "_";

  switch (card.suit) {
		case "S":
      ret += "spades";
			break;
		case "H":
      ret += "hearts";
			break;
		case "D":
      ret += "diamonds";
			break;
		case "C":
      ret += "clubs";
			break;
		case "J":
      console.log("testing");
      ret += "joker";
			break;
  }

  ret += ".png";
  return ret;
}

/* Use if hand has more than 0 cards */
function handToCommand(hand) {
  let command = "magick montage ";
  let handSize = hand.length;

  for (let i = 0; i < handSize; i++) {
    command += cardToFile(hand[i]);
    command += " ";
  }
  command += `-tile ${handSize}x1 images/hand.png`;

  return command;
}

async function showHandPNG(hand) {
  if (hand.length == 0) {
    return "./cards/empty.png";
  } else {
    if (!fs.existsSync("./images")) {
      await exec("mkdir images", (error, stdout, stderr) => {
        if (error) {
          console.log(`ERROR\n${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr\n${stderr.message}`);
          return;
        }
      });
    }
    await exec(handToCommand(hand), (error, stdout, stderr) => {
      if (error) {
        console.log(`ERROR\n${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr\n${stderr.message}`);
        return;
      }
    });

    return "./images/hand.png";
  }
}

/* old test */
// let playerList = [p1, p2, p3, p4, p5, p6] = [new Player("1"), new Player("2"), new Player("3"), new Player("4"), new Player("5"), new Player("@varghs")];
// let fishGame = new Fish(playerList); // obsolete line (Fish now takes channel argument)
// fishGame.declare(p1, [new Card("H", "8"), new Card("S", "8"), new Card("D", "8"), new Card("C", "8"), new Card("J", "B"), new Card("J", "R")], [p3, p5, p3, p1, p5, p1]);
// console.log(fishGame.halfSuitStatus);
// console.log(p1.hand)
// console.log(p3.hand)
// console.log(p5.hand)

// fishGame.ask(p1, p2, new Card("C", "3"));
// console.log(p2.hand);

let fishGame;

client.once('ready', () => {
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
    case "ping":
      client.commands.get("ping").execute(message, args);
      break;
    case "test1":
      client.commands.get("test1").execute(message, args);
      break;
    case "fish":
      switch (args[0]) {
        case "begin":
          let userList = args.slice(1, 7);
          let playerList = [];
          for (let i = 0; i < 6; i++) {
            playerList.push(new Player(userList[i].replace("<@", "").replace(">", "")));
          }
          fishGame = new Fish(message.channel, playerList);          // idk if this fish game is accessible to other commands lol
          console.log(fishGame);

          fishGame.printTeams();
          break;
        case "check":
          fishGame.printTeams();
          break;
        case "add":
          let player = new Player(args[1].replace("<@", "").replace(">", ""), client.users.cache.get(args[1].replace("<@", "").replace(">", "")).username);

          fishGame.addPlayer(player, Number(args[2]));
          break;
        case "log":
          switch (args[1]) {
            case "game":
              console.log(fishGame);
              break;
            case "table":
              console.log(fishGame.table);
              break;
            case "players":
              for (let i = 0; i < fishGame.table.length; i++) {
                console.log(fishGame.table[i]);
              }
              break;
            default:
              console.log("Specify object to log: game, table, players");
              break;
          }
          break;
        case "ask":
          let asker = fishGame.getPlayerFromId(message.author.id);
          let asked = fishGame.getPlayerFromId(args[1].replace("<@", "").replace(">", ""));
          fishGame.ask(asker, asked, new Card(args[3], args[2])); // TODO change from Jack of Spades to actual card

          break;
        case "burn":
          let giver = fishGame.getPlayerFromId(message.author.id);
          fishGame.burn(giver, new Card(args[2], args[1]));

          break;
      }
      break;
    case "button":
      const button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("start_game_button").setLabel("Create Game!").setStyle(ButtonStyle.Primary))
      const embed = new EmbedBuilder().setColor("Blue").setDescription(`Click the button below to create your new game!`).setAuthor({ name: `${message.author.username}`, iconURL: `${message.author.displayAvatarURL()}` })

      message.channel.send({ embeds: [embed], components: [button] })

      break;
  }
})

function makeEmbedPlayerFields() {
  game = new EmbedBuilder().setColor("Blue").setTitle("New Fish Game").setDescription(`New Fish game starting, react below to reserve a spot`)

  game.addFields(
    { name: 'Team 1', value: fishGame.team1.length > 0 ? fishGame.team1.map(player => player.username).join('\n') : "None", inline: true },
    { name: 'Team 2', value: fishGame.team2.length > 0 ? fishGame.team2.map(player => player.username).join('\n') : "None", inline: true },
  )
}

function showCards(channel) {
  const embed = new EmbedBuilder().setColor("Red").setTitle("Click below to view your hand").setDescription(`Please choose your prefered team style in the dropdown!`)
  const button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("cards").setLabel("Show Cards!").setStyle(ButtonStyle.Primary))
  
  channel.send({embeds:[embed], components:[button]})
}

function makeStartMenuActionBar() {
  startMenuActionRow = new ActionRowBuilder()

  if (random) {
    startMenuActionRow.addComponents(new ButtonBuilder().setCustomId("randomize").setLabel("Randomize").setStyle(ButtonStyle.Secondary))
  }

  if (fishGame.team1.length == 3 && fishGame.team2.length == 3) {
    startMenuActionRow.addComponents(new ButtonBuilder().setCustomId("start").setLabel("Start Game!").setStyle(ButtonStyle.Success))
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  switch (interaction.customId) {
    case "start_game_button":
      const actionRow = new ActionRowBuilder();

      const teams = new StringSelectMenuBuilder()
        .setCustomId('teams')
        .setMinValues(1)
        .setPlaceholder('Team Format!')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Manual')
            .setDescription('Everyone indivually picks their team')
            .setValue('Manual'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Random')
            .setDescription('Team selection is random')
            .setValue('Random'),
        );

      actionRow.addComponents(teams)

      const embed = new EmbedBuilder().setColor("Red").setTitle("Fish Game Setup Wizard").setDescription(`Please choose your prefered team style in the dropdown!`).setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL()}` })
      const newMessage = await interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true,
      });
      interaction.message.delete()
      await wait(5000);
      newMessage.delete()
      break;
    case "teams":
      let choice = interaction.values[0];
      fishGame = new Fish(interaction.message.channel);          // idk if this fish game is accessible to other commands lol
      random = choice == "Random"
      makeEmbedPlayerFields()
      makeStartMenuActionBar()

      let sentMessage;

      if (startMenuActionRow.components.length > 0) {
        sentMessage = await interaction.message.channel.send({ embeds: [game], components: [startMenuActionRow] })
      }
      else {
        sentMessage = await interaction.message.channel.send({ embeds: [game] })
      }
      startMenu = sentMessage;
      if (choice == "Random") {
        await sentMessage.react("🐟")
      }
      else {
        await sentMessage.react("1️⃣");
        await sentMessage.react("2️⃣");
      }

      break;
    case "start":
      fishGame.start()
      break;
    case "randomize":
      let players = []
      fishGame.team1.forEach((player) => {players.push(player)})
      fishGame.team2.forEach((player) => {players.push(player)})
      
      fishGame.team1 = []
      fishGame.team2 = []

      players.forEach((player) => {putPlayerOnRandomTeam(player)})

      makeEmbedPlayerFields(game)
      makeStartMenuActionBar()

      if (startMenuActionRow.components.length > 0) {
        startMenu.edit({ embeds: [game], components: [startMenuActionRow] })
      }
      else {
        startMenu.edit({ embeds: [game] })
      }

      interaction.deferUpdate("TEST");

      break;
    case "cards":
      let p = fishGame.getPlayerFromId(interaction.user.id);
      let hand = p.hand;
      interaction.reply({files: [showHandPNG(hand)], ephemeral:true});
      break;
  }
});

function putOnRandomTeam(id, username) {
  let team = Math.floor(Math.random() * 2);
  let teamArr = team == 0 ? fishGame.team1 : fishGame.team2;
  if (teamArr.length >= 3) {
    team = 1 - team;
  }
  teamArr = team == 0 ? fishGame.team1 : fishGame.team2;
  if (teamArr.length <= 2) {
    fishGame.addPlayer(new Player(id, username), team + 1);
  }
}

function putPlayerOnRandomTeam(player) {
  let team = Math.floor(Math.random() * 2);
  let teamArr = team == 0 ? fishGame.team1 : fishGame.team2;
  if (teamArr.length >= 3) {
    team = 1 - team;
  }
  teamArr = team == 0 ? fishGame.team1 : fishGame.team2;
  if (teamArr.length <= 2) {
    fishGame.addPlayer(player, team + 1);
  }
}

client.on('messageReactionAdd', (reaction, user) => {
  if (startMenu.id != reaction.message.id || user.id == reaction.message.author.id) { return }

  if (reaction.emoji.name === '1️⃣') {
    if (fishGame.team1.length <= 2) {
      fishGame.addPlayer(new Player(user.id, user.username), 1);
    }
  }
  else if (reaction.emoji.name === '2️⃣') {
    if (fishGame.team2.length <= 2) {
      fishGame.addPlayer(new Player(user.id, user.username), 2);
    }
  }
  else if (reaction.emoji.name === '🐟') {
    putOnRandomTeam(user.id, user.username)
  }

  makeEmbedPlayerFields(game)
  makeStartMenuActionBar()

  if (startMenuActionRow.components.length > 0) {
    startMenu.edit({ embeds: [game], components: [startMenuActionRow] })
  }
  else {
    startMenu.edit({ embeds: [game] })
  }
});

client.on('messageReactionRemove', (reaction, user) => {
  if (startMenu.id != reaction.message.id || user.id == reaction.message.author.id) { return }

  if (reaction.emoji.name == '1️⃣' || reaction.emoji.name == '2️⃣' || reaction.emoji.name == '2️⃣') {
    fishGame.removePlayer(user.id, 1);
    makeEmbedPlayerFields(game)
  }
});

client.login(process.env.TOKEN);

// client.api.interactions(this.id, this.token).callback.post( {data: { type: 4, data: {flags:64, content: message}}  }))
