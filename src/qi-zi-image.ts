// eslint-disable-next-line
const black = require("./assets/black.png");
// eslint-disable-next-line
const white = require("./assets/white.png");

export default (color: "black" | "white") => {
  const qiZi = document.createElement("img");
  qiZi.src = color === "black" ? black : white;
  qiZi.style.width = "30px";
  qiZi.style.height = "30px";
  return qiZi;
};
