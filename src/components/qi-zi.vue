<template>
  <div
    class="qi-zi"
    :style="{
      left: `${dot.position[0] * 32 - 15}px`,
      top: `${dot.position[1] * 32 - 15}px`,
      backgroundColor: dot.color
    }"
  ></div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class extends Vue {
  @Prop() dot!: { position: [number, number]; color: "black" | "white" };
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.qi-zi {
  position: absolute;
  z-index: 10;
  width: 30px;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid black;
  border-radius: 50%;
}
</style>
