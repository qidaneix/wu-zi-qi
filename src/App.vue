<template>
  <div id="app">
    <div
      class="qi-pan"
      @dragenter.prevent
      @dragover.prevent
      @drop.prevent="drop"
    >
      <div class="item" v-for="i in 20 * 20" :key="i"></div>
      <qi-zi
        v-for="dot in realDots"
        :dot="dot"
        :key="JSON.stringify(dot.position)"
      ></qi-zi>
    </div>
    <div class="wrap">
      <div class="qi-zi-guan black" @dragstart="dragstart($event, 'black')">
        <div class="inner"></div>
      </div>
      <div class="qi-zi-guan white" @dragstart="dragstart($event, 'white')">
        <div class="inner"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import QiZi from "./components/qi-zi.vue";

// 棋盘上的交叉点
export interface Dot {
  position: [number, number];
  color: undefined | "white" | "black";
}

// 棋盘上所有交叉点的数组
const dots: Dot[] = [];

for (let y = 0; y <= 20; y++) {
  for (let x = 0; x <= 20; x++) {
    const dot: Dot = {
      position: [x, y],
      color: undefined
    };
    dots.push(dot);
  }
}

@Component({
  components: {
    QiZi
  }
})
export default class App extends Vue {
  dots = dots;

  // 已经落子点
  get realDots() {
    return this.dots.filter(dot => dot.color);
  }

  // 拿子
  dragstart(event: DragEvent, color: "black" | "white") {
    if (event.dataTransfer) {
      // 从哪个棋盅拿的棋子
      event.dataTransfer.setData("text", color);
    }
  }

  // 计算落子位置
  drop(event: DragEvent) {
    if (!event.dataTransfer) {
      return;
    }
    // 获取棋子颜色
    const color = event.dataTransfer.getData("text");
    console.log(color);
    if (color !== "black" && color !== "white") {
      console.error("不能这样拖拽");
      return;
    }
    // 鼠标下落到小方块中的位置
    const dropPosition: [number, number] = [event.offsetX, event.offsetY];
    // 棋子应该定位的位置，初始值为**小方块的offset位置**
    const position: [number, number] = [
      (event.target as HTMLDivElement).offsetLeft / 32,
      (event.target as HTMLDivElement).offsetTop / 32
    ];
    if (dropPosition[0] <= 16 && dropPosition[1] <= 16) {
      // 定位在方块左上角，nothing need to do
    } else if (dropPosition[0] > 16 && dropPosition[1] <= 16) {
      // 定位在方块右上角
      position[0] += 1;
    } else if (dropPosition[0] <= 16 && dropPosition[1] > 16) {
      // 定位在方块左下角
      position[1] += 1;
    } else if (dropPosition[0] > 16 && dropPosition[1] > 16) {
      // 定位在方块右下角
      position[0] += 1;
      position[1] += 1;
    }
    this.addQiZi({ position, color });
  }

  // 落子
  addQiZi(newDot: { position: [number, number]; color: "white" | "black" }) {
    // 性能优化，之前使用数组的find的方法，现在直接根据(x,y)定位数组中的索引
    const matchDot = this.dots[
      this.calcuIndex(newDot.position[0], newDot.position[1])
    ];
    if (!matchDot) {
      // 不应该出现匹配不到的情况
      throw new Error(JSON.stringify(newDot));
    }
    if (matchDot.color) {
      console.warn("这个位置已经有棋子了！");
      return false;
    }
    matchDot.color = newDot.color;
    if (this.isWin(matchDot)) {
      console.log(`${matchDot.color} win！`);
    }
  }

  // 计算落子方是否胜利
  isWin(originDot: Dot) {
    // 以originDot为起点建立四个方向上的数组(横，竖，斜杠，反斜杠)
    const xDots = this.calcuDots(originDot, "x"); // 横
    const yDots = this.calcuDots(originDot, "y"); // 竖
    const xyDots = this.calcuDots(originDot, "xy"); // 斜杠
    const yxDots = this.calcuDots(originDot, "yx"); // 反斜杠
    // 上面四个数组中，任意一个数组有连续的五个元素的为相同的color（与origin.color相同）为胜利
    return (
      this.calcuWin(xDots, originDot.color as "white" | "black") ||
      this.calcuWin(yDots, originDot.color as "white" | "black") ||
      this.calcuWin(xyDots, originDot.color as "white" | "black") ||
      this.calcuWin(yxDots, originDot.color as "white" | "black")
    );
  }

  // 计算连子
  calcuDots(originDot: Dot, direction: "x" | "y" | "xy" | "yx") {
    const contDot: Dot[] = [originDot];
    // 性能优化
    switch (direction) {
      case "x":
        for (let i = 1; i <= 4; i++) {
          if (originDot.position[0] - i >= 0) {
            contDot.unshift(
              this.dots[
                this.calcuIndex(
                  originDot.position[0] - i,
                  originDot.position[1]
                )
              ]
            );
          }
          if (originDot.position[0] + i <= 20) {
            contDot.push(
              this.dots[
                this.calcuIndex(
                  originDot.position[0] + i,
                  originDot.position[1]
                )
              ]
            );
          }
        }
        break;
      case "y":
        for (let i = 1; i <= 4; i++) {
          if (originDot.position[1] - i >= 0) {
            contDot.unshift(
              this.dots[
                this.calcuIndex(
                  originDot.position[0],
                  originDot.position[1] - i
                )
              ]
            );
          }
          if (originDot.position[1] + i <= 20) {
            contDot.push(
              this.dots[
                this.calcuIndex(
                  originDot.position[0],
                  originDot.position[1] + i
                )
              ]
            );
          }
        }
        break;
      case "xy":
        for (let i = 1; i <= 4; i++) {
          if (originDot.position[0] - i >= 0) {
            contDot.unshift(
              this.dots[
                this.calcuIndex(
                  originDot.position[0] - i,
                  originDot.position[1] + i
                )
              ]
            );
          }
          if (originDot.position[0] + i <= 20) {
            contDot.push(
              this.dots[
                this.calcuIndex(
                  originDot.position[0] + i,
                  originDot.position[1] - i
                )
              ]
            );
          }
        }
        break;
      case "yx":
        for (let i = 1; i <= 4; i++) {
          if (originDot.position[0] - i >= 0) {
            contDot.unshift(
              this.dots[
                this.calcuIndex(
                  originDot.position[0] - i,
                  originDot.position[1] - i
                )
              ]
            );
          }
          if (originDot.position[0] + i <= 20) {
            contDot.push(
              this.dots[
                this.calcuIndex(
                  originDot.position[0] + i,
                  originDot.position[1] + i
                )
              ]
            );
          }
        }
        break;
    }
    return contDot;
  }

  // 计算一个dot数组内是否有连续的五个相同颜色，dot数组长度5-9
  calcuWin(contDots: Dot[], color: "black" | "white") {
    let flag = false;
    // 包含连续5个元素的数组数量
    const fiveDotsNum = contDots.length - 4;
    // 遍历父数组中所有可能的5元素子数组
    for (let i = 0; i < fiveDotsNum; i++) {
      // 生成子数组
      const subDots = contDots.slice(i, i + 5);
      // 满足条件，修改标志位
      if (subDots.every(dot => dot.color === color)) {
        flag = true;
        break;
      }
    }
    return flag;
  }

  calcuIndex(x: number, y: number) {
    return x + y * 21;
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.qi-pan {
  box-sizing: content-box;
  width: 640px;
  height: 640px;
  position: relative;
  display: grid;
  grid-template-columns: repeat(20, 5%);
  grid-template-rows: repeat(20, 5%);
  border: 2px solid black;
  margin-left: auto;
  margin-right: auto;
  .item {
    box-sizing: border-box;
    border: 1px solid black;
  }
}

.wrap {
  width: 640px;
  margin: 20px auto;
  display: flex;
  justify-content: space-between;
  position: relative;
}

.qi-zi-guan {
  width: 100px;
  height: 100px;
  padding: 4px;
  border: 4px solid black;
  border-radius: 50%;
  text-align: center;
  z-index: 1000;
  &.black {
    .inner {
      background: black;
    }
  }
  &.white {
    .inner {
      background: white;
    }
  }
  .inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid black;
    box-sizing: border-box;
  }
}
</style>
