import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

// 棋盘上的交叉点
export interface Dot {
  position: [number, number];
  color: undefined | "white" | "black";
}

// 棋盘上所有交叉点的数组
const dots: Dot[] = [];

for (let x = 0; x <= 20; x++) {
  for (let y = 0; y <= 20; y++) {
    const dot: Dot = {
      position: [x, y],
      color: undefined
    };
    dots.push(dot);
  }
}

export default new Vuex.Store({
  state: {
    dots
  },
  mutations: {
    addQiZi(
      state,
      payload: { position: [number, number]; color: "white" | "black" }
    ) {
      const matchDot = state.dots.find(
        dot =>
          dot.position[0] === payload.position[0] &&
          dot.position[1] === payload.position[1]
      );
      if (matchDot) {
        if (matchDot.color) {
          console.warn("这个位置已经有棋子了！");
          return;
        }
        matchDot.color = payload.color;
      } else {
        throw new Error(JSON.stringify(payload));
      }
    }
  },
  actions: {},
  modules: {}
});
