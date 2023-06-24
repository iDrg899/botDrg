const { exec } = require("child_process");

function cardToFile(card) {
  let ret = "";
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

  switch (this.suit) {
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
      ret += "joker";
			break;
  }

  ret += ".png";
  return ret;
}

function handToCommand(hand) {
  let command = "magick montage";
  let handSize = hand.length;
  if (handSize == 0) {

  }
}


exec("montage", (error, stdout, stderr) => {
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
