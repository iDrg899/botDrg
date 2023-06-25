const { exec } = require("child_process");
const fs = require("fs");

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

function showHandPNG(hand) {
  if (hand.length == 0) {
    return "cards/empty.png";
  } else {
    if (!fs.existsSync("./images")) {
      exec("mkdir images", (error, stdout, stderr) => {
        if (error) {
          console.log(`ERROR\n${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr\n${stderr.message}`);
          return;
        }
        console.log(`stdout:\n${stdout}`);
      });
    }
    exec(handToCommand(hand), (error, stdout, stderr) => {
      if (error) {
        console.log(`ERROR\n${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr\n${stderr.message}`);
        return;
      }

      console.log(`stdout:\n${stdout}`);
    });

    return "images/hand.png";
  }
}

const SUITS = ["S", "H", "D", "C", "J"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "B", "R"];
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
}

let h1 = [];
let h2 = [new Card("S", "5")];
console.log(showHandPNG(h1));
console.log(showHandPNG(h2));
