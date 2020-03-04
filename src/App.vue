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
    <div class="qi-zi-guan black" @dragstart="dragstart($event, 'black')"></div>
    <div class="qi-zi-guan white" @dragstart="dragstart($event, 'white')"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import QiZi from "./components/qi-zi.vue";

import { Dot } from "./store";

@Component({
  components: {
    QiZi
  }
})
export default class App extends Vue {
  // dot: Dot = {
  //   position: [0, 0],
  //   color: "black"
  // };
  get realDots() {
    return (this.$store.state.dots as Dot[]).filter(dot => dot.color);
  }
  dragstart(event: DragEvent, color: "black" | "white") {
    if (event.dataTransfer) {
      // 从哪个棋盅拿的棋子
      event.dataTransfer.setData("text", color);
    }
  }
  drop(event: DragEvent) {
    if (event.dataTransfer) {
      // 获取棋子颜色
      const color = event.dataTransfer.getData("text");
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
      // this.$set(this.dot.position, 0, position[0] * 32);
      // this.$set(this.dot.position, 1, position[1] * 32);
      // this.dot.color = color as "black" | "white";
      this.$store.commit("addQiZi", { position, color });
    }
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
.qi-zi-guan {
  width: 100px;
  height: 100px;
  &.black {
    background: black;
  }
  &.white {
    background: white;
  }
}
</style>
