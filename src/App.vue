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
      <div
        class="qi-zi-guan black"
        draggable="true"
        @dragstart="dragstart($event, 'black')"
      >
        <div class="inner"></div>
      </div>
      <div
        class="qi-zi-guan white"
        draggable="true"
        v-if="!isComputerGame"
        @dragstart="dragstart($event, 'white')"
      >
        <div class="inner"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import QiZi from "./components/qi-zi.vue";
import qiZiImage from "./qi-zi-image";

// 棋盘上的交叉点
interface Dot {
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
export default class extends Vue {
  dots = dots;
  isComputerGame = false; // 人机博弈标志位

  // 已经落子点
  get realDots() {
    return this.dots.filter(dot => dot.color);
  }

  // 钩子
  mounted() {
    this.isComputerGame = confirm("是否选择人机博弈？");
  }

  // 拿子
  dragstart(event: DragEvent, color: "black" | "white") {
    if (event.dataTransfer) {
      // 从哪个棋盅拿的棋子
      event.dataTransfer.setData("text", color);
      event.dataTransfer.setDragImage(qiZiImage(color), 15, 15);
    }
  }

  // 计算落子位置
  drop(event: DragEvent) {
    if (!event.dataTransfer) {
      return;
    }
    // 获取棋子颜色
    const color = event.dataTransfer.getData("text");
    // 如果不是从棋盅拖拽的，color值可能为' '
    if (color !== "black" && color !== "white") {
      // 不能这样拖拽
      return;
    }
    if ((event.target as HTMLDivElement).className === "qi-zi") {
      alert("这个位置已经有棋子了！");
      return;
    }
    if ((event.target as HTMLDivElement).className !== "item") {
      // 没有拖拽到棋盘上
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
    /**
     * 性能优化：
     * 之前使用数组的find的方法，现在直接根据(x,y)定位数组中的索引
     */
    const matchDot = this.dots[
      this.calcuIndex(newDot.position[0], newDot.position[1])
    ];
    if (!matchDot) {
      // 不应该出现匹配不到的情况
      throw new Error(JSON.stringify(newDot));
    }
    if (matchDot.color) {
      alert("这个位置已经有棋子了！");
      return false;
    }
    matchDot.color = newDot.color;
    setTimeout(() => {
      this.isWinAndNext(matchDot);
    }, 100);
  }

  // 计算落子方是否胜利
  isWinAndNext(matchDot: Dot) {
    // 以matchDot为原点建立四个方向上(横，竖，斜杠，反斜杠)的，color相同的数组，长度1-9
    const xDots = this.calcuDots(matchDot, "x"); // 横
    const yDots = this.calcuDots(matchDot, "y"); // 竖
    const xyDots = this.calcuDots(matchDot, "xy"); // 斜杠
    const yxDots = this.calcuDots(matchDot, "yx"); // 反斜杠
    /**
     * 计算落子方是否胜利：
     * 上面四个数组中，任意一个数组length大于5，则matchDot.color胜利
     *  */
    if (
      xDots.length > 4 ||
      yDots.length > 4 ||
      xyDots.length > 4 ||
      yxDots.length > 4
    ) {
      const restart = confirm(
        `${matchDot.color === "black" ? "黑棋" : "白棋"}胜！是否重开？`
      );
      if (restart) {
        this.dots.forEach(dot => (dot.color = undefined));
      }
    } else if (this.isComputerGame && matchDot.color === "black") {
      // 若没有大于5的，且轮到白棋下子，且为电脑对弈
      const dotsObj = {
        x: xDots,
        y: yDots,
        xy: xyDots,
        yx: yxDots
      };
      /**
       * debug：没有处理电脑获胜的情况！
       */
      // 电脑下的白棋
      let computerQizi: Dot | false;
      const firLongDotsObj = this.findMaxDots(dotsObj);
      computerQizi = this.computerAddQizi(firLongDotsObj);

      if (!computerQizi) {
        delete dotsObj[firLongDotsObj.direction as "x" | "y" | "xy" | "yx"];
        const secLongDotsObj = this.findMaxDots(dotsObj);
        computerQizi = this.computerAddQizi(secLongDotsObj);

        if (!computerQizi) {
          delete dotsObj[secLongDotsObj.direction as "x" | "y" | "xy" | "yx"];
          const thrLongDotsObj = this.findMaxDots(dotsObj);
          computerQizi = this.computerAddQizi(thrLongDotsObj);

          if (!computerQizi) {
            delete dotsObj[thrLongDotsObj.direction as "x" | "y" | "xy" | "yx"];
            const fouLongDotsObj = this.findMaxDots(dotsObj);
            computerQizi = this.computerAddQizi(fouLongDotsObj);

            if (!computerQizi) {
              // 四个方向都被封死，随便落子 - -||
              const undeDot = this.dots.find(dot => !dot.color);
              if (undeDot) {
                undeDot.color = "white";
                computerQizi = undeDot;
              } else {
                // 这都不行？？？game over
                alert("game over");
                window.location.reload();
              }
            }
          }
        }
      }
      // 计算电脑是否胜利
      setTimeout(() => {
        this.isWinAndNext(computerQizi as Dot);
      }, 100);
    }
  }

  // 计算连子
  calcuDots(dot: Dot, direction: "x" | "y" | "xy" | "yx") {
    /**
     * 再次优化：
     * 1. 只收集相同颜色的棋子，不再收集所有棋子
     * 2. 尽可能少的减少循环次数(previousFlag与nextFlag都为false，则停止循环)
     * 3. 充分利用&&的短路计算避免if判断复杂
     * 4. 计算结果既可以用于判断胜利，又可以用于电脑对弈，避免重复计算
     * 5. if-else简化写法，提升可读性
     * 6. 不再需要calcuWin这个超高时间复杂度的方法
     */
    const contDots: Dot[] = [dot];
    let previousFlag = true; // 能否继续往前找的标志
    let nextFlag = true; // 能否继续往后找的标志
    switch (direction) {
      case "x":
        for (let i = 1; i <= 4; i++) {
          if (
            previousFlag && // flag合法
            dot.position[0] - i >= 0 && // 索引位置合法
            this.dots[this.calcuIndex(dot.position[0] - i, dot.position[1])]
              .color === dot.color // 索引位置颜色匹配
          )
            contDots.unshift(
              this.dots[this.calcuIndex(dot.position[0] - i, dot.position[1])]
            );
          else previousFlag = false;

          if (
            nextFlag &&
            dot.position[0] + i <= 20 &&
            this.dots[this.calcuIndex(dot.position[0] + i, dot.position[1])]
              .color === dot.color
          )
            contDots.push(
              this.dots[this.calcuIndex(dot.position[0] + i, dot.position[1])]
            );
          else nextFlag = false;

          if (!previousFlag && !nextFlag) break;
        }
        break;

      case "y":
        for (let i = 1; i <= 4; i++) {
          if (
            previousFlag &&
            dot.position[1] - i >= 0 &&
            this.dots[this.calcuIndex(dot.position[0], dot.position[1] - i)]
              .color === dot.color
          )
            contDots.unshift(
              this.dots[this.calcuIndex(dot.position[0], dot.position[1] - i)]
            );
          else previousFlag = false;

          if (
            nextFlag &&
            dot.position[1] + i <= 20 &&
            this.dots[this.calcuIndex(dot.position[0], dot.position[1] + i)]
              .color === dot.color
          )
            contDots.push(
              this.dots[this.calcuIndex(dot.position[0], dot.position[1] + i)]
            );
          else nextFlag = false;

          if (!previousFlag && !nextFlag) break;
        }
        break;

      case "xy":
        for (let i = 1; i <= 4; i++) {
          if (
            previousFlag &&
            dot.position[0] - i >= 0 &&
            dot.position[1] + i <= 20 &&
            this.dots[this.calcuIndex(dot.position[0] - i, dot.position[1] + i)]
              .color === dot.color
          )
            contDots.unshift(
              this.dots[
                this.calcuIndex(dot.position[0] - i, dot.position[1] + i)
              ]
            );
          else previousFlag = false;

          if (
            nextFlag &&
            dot.position[0] + i <= 20 &&
            dot.position[1] - i >= 0 &&
            this.dots[this.calcuIndex(dot.position[0] + i, dot.position[1] - i)]
              .color === dot.color
          )
            contDots.push(
              this.dots[
                this.calcuIndex(dot.position[0] + i, dot.position[1] - i)
              ]
            );
          else nextFlag = false;

          if (!previousFlag && !nextFlag) break;
        }
        break;

      case "yx":
        for (let i = 1; i <= 4; i++) {
          if (
            previousFlag &&
            dot.position[0] - i >= 0 &&
            dot.position[1] - i >= 0 &&
            this.dots[this.calcuIndex(dot.position[0] - i, dot.position[1] - i)]
              .color === dot.color
          )
            contDots.unshift(
              this.dots[
                this.calcuIndex(dot.position[0] - i, dot.position[1] - i)
              ]
            );
          else previousFlag = false;

          if (
            nextFlag &&
            dot.position[0] + i <= 20 &&
            dot.position[1] + i <= 20 &&
            this.dots[this.calcuIndex(dot.position[0] + i, dot.position[1] + i)]
              .color === dot.color
          )
            contDots.push(
              this.dots[
                this.calcuIndex(dot.position[0] + i, dot.position[1] + i)
              ]
            );
          else nextFlag = false;

          if (!previousFlag && !nextFlag) break;
        }
        break;
    }
    return contDots;
  }

  // 找到最多的点的数组及其方向
  findMaxDots(dotsObj: { [key: string]: Dot[] }) {
    const directions = Object.keys(dotsObj);
    // 找到最长长度
    const max = Math.max(
      ...directions.map(direction => dotsObj[direction].length)
    );
    const dir = directions.find(direction => dotsObj[direction].length === max);
    return { direction: dir as string, dots: dotsObj[dir as string] };
  }

  // 电脑落子
  computerAddQizi(singleDotsObj: { direction: string; dots: Dot[] }) {
    const direction = singleDotsObj.direction; // 黑子数组的方向
    const dots = singleDotsObj.dots; // 黑子数组
    switch (direction) {
      case "x":
        if (
          dots[0].position[0] - 1 >= 0 &&
          !this.dots[
            this.calcuIndex(dots[0].position[0] - 1, dots[0].position[1])
          ].color
        ) {
          // 向前方向
          const dot = this.dots[
            this.calcuIndex(dots[0].position[0] - 1, dots[0].position[1])
          ];
          dot.color = "white";
          return dot;
        } else if (
          dots[dots.length - 1].position[0] + 1 <= 20 &&
          !this.dots[
            this.calcuIndex(
              dots[dots.length - 1].position[0] + 1,
              dots[dots.length - 1].position[1]
            )
          ].color
        ) {
          // 向后方向
          const dot = this.dots[
            this.calcuIndex(
              dots[dots.length - 1].position[0] + 1,
              dots[dots.length - 1].position[1]
            )
          ];
          dot.color = "white";
          return dot;
        }
        return false;

      case "y":
        if (
          dots[0].position[1] - 1 >= 0 &&
          !this.dots[
            this.calcuIndex(dots[0].position[0], dots[0].position[1] - 1)
          ].color
        ) {
          const dot = this.dots[
            this.calcuIndex(dots[0].position[0], dots[0].position[1] - 1)
          ];
          dot.color = "white";
          return dot;
        } else if (
          dots[dots.length - 1].position[1] + 1 <= 20 &&
          !this.dots[
            this.calcuIndex(
              dots[dots.length - 1].position[0],
              dots[dots.length - 1].position[1] + 1
            )
          ].color
        ) {
          const dot = this.dots[
            this.calcuIndex(
              dots[dots.length - 1].position[0],
              dots[dots.length - 1].position[1] + 1
            )
          ];
          dot.color = "white";
          return dot;
        }
        return false;

      case "xy":
        if (
          dots[0].position[0] - 1 >= 0 &&
          dots[0].position[1] + 1 <= 20 &&
          !this.dots[
            this.calcuIndex(dots[0].position[0] - 1, dots[0].position[1] + 1)
          ].color
        ) {
          const dot = this.dots[
            this.calcuIndex(dots[0].position[0] - 1, dots[0].position[1] + 1)
          ];
          dot.color = "white";
          return dot;
        } else if (
          dots[dots.length - 1].position[0] + 1 <= 20 &&
          dots[dots.length - 1].position[1] - 1 >= 0 &&
          !this.dots[
            this.calcuIndex(
              dots[dots.length - 1].position[0] + 1,
              dots[dots.length - 1].position[1] - 1
            )
          ].color
        ) {
          const dot = this.dots[
            this.calcuIndex(
              dots[dots.length - 1].position[0] + 1,
              dots[dots.length - 1].position[1] - 1
            )
          ];
          dot.color = "white";
          return dot;
        }
        return false;

      case "yx":
        if (
          dots[0].position[0] - 1 >= 0 &&
          dots[0].position[1] - 1 >= 0 &&
          !this.dots[
            this.calcuIndex(dots[0].position[0] - 1, dots[0].position[1] - 1)
          ].color
        ) {
          const dot = this.dots[
            this.calcuIndex(dots[0].position[0] - 1, dots[0].position[1] - 1)
          ];
          dot.color = "white";
          return dot;
        } else if (
          dots[dots.length - 1].position[0] + 1 <= 20 &&
          dots[dots.length - 1].position[1] + 1 <= 20 &&
          !this.dots[
            this.calcuIndex(
              dots[dots.length - 1].position[0] + 1,
              dots[dots.length - 1].position[1] + 1
            )
          ].color
        ) {
          const dot = this.dots[
            this.calcuIndex(
              dots[dots.length - 1].position[0] + 1,
              dots[dots.length - 1].position[1] + 1
            )
          ];
          dot.color = "white";
          return dot;
        }
        return false;
    }
    // 程序不可能走到这里
    throw new Error("something wrong");
  }

  // 找到对应坐标的dots数组索引
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
