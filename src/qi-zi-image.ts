// eslint-disable-next-line
const black = require("./assets/black.png");
// eslint-disable-next-line
const white = require("./assets/white.png");

export default (color: "black" | "white") => {
  const qizi = document.createElement("img");
  qizi.src = color === "black" ? black : white;
  qizi.style.width = "30px";
  qizi.style.height = "30px";
  return qizi;
};
