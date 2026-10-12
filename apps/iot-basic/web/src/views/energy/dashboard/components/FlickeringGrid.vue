<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, toRefs } from 'vue';

interface FlickeringGridProps {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  maxOpacity?: number;
}

const props = withDefaults(defineProps<FlickeringGridProps>(), {
  squareSize: 4,
  gridGap: 6,
  flickerChance: 0.3,
  color: 'rgb(0, 0, 0)',
  maxOpacity: 0.3,
});

const { squareSize, gridGap, flickerChance, color, maxOpacity, width, height } =
  toRefs(props);

const containerRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
const context = ref<CanvasRenderingContext2D>();

const isInView = ref(false);
const canvasSize = ref({ width: 0, height: 0 });

const computedColor = computed(() => {
  if (!context.value) return 'rgba(255, 0, 0,';
  const hex = color.value.replace(/^#/, '');
  if (hex.length === 6 || hex.length === 3) {
    const bigint = Number.parseInt(hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b},`;
  }
  const match = color.value.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]},`;
  }
  return 'rgba(255, 255, 255,';
});

function setupCanvas(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
): { cols: number; rows: number; squares: Float32Array; dpr: number } {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const cols = Math.floor(w / (squareSize.value + gridGap.value));
  const rows = Math.floor(h / (squareSize.value + gridGap.value));

  const squares = new Float32Array(cols * rows);
  for (let i = 0; i < squares.length; i++) {
    squares[i] = Math.random() * maxOpacity.value;
  }
  return { cols, rows, squares, dpr };
}

function updateSquares(squares: Float32Array, deltaTime: number) {
  for (let i = 0; i < squares.length; i++) {
    if (Math.random() < flickerChance.value * deltaTime) {
      squares[i] = Math.random() * maxOpacity.value;
    }
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cols: number,
  rows: number,
  squares: Float32Array,
  dpr: number,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const opacity = squares[i * rows + j];
      ctx.fillStyle = `${computedColor.value}${opacity})`;
      ctx.fillRect(
        i * (squareSize.value + gridGap.value) * dpr,
        j * (squareSize.value + gridGap.value) * dpr,
        squareSize.value * dpr,
        squareSize.value * dpr,
      );
    }
  }
}

const gridParams = ref<ReturnType<typeof setupCanvas>>();

function updateCanvasSize() {
  const newWidth = width.value || containerRef.value!.clientWidth;
  const newHeight = height.value || containerRef.value!.clientHeight;

  canvasSize.value = { width: newWidth, height: newHeight };
  gridParams.value = setupCanvas(canvasRef.value!, newWidth, newHeight);
}

let animationFrameId: number | undefined;
let resizeObserver: ResizeObserver | undefined;
let intersectionObserver: IntersectionObserver | undefined;
let lastTime = 0;

function animate(time: number) {
  if (!isInView.value) return;

  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;

  updateSquares(gridParams.value!.squares, deltaTime);
  drawGrid(
    context.value!,
    canvasRef.value!.width,
    canvasRef.value!.height,
    gridParams.value!.cols,
    gridParams.value!.rows,
    gridParams.value!.squares,
    gridParams.value!.dpr,
  );
  animationFrameId = requestAnimationFrame(animate);
}

onMounted(() => {
  if (!canvasRef.value || !containerRef.value) return;
  context.value = canvasRef.value.getContext('2d')!;
  if (!context.value) return;

  updateCanvasSize();

  resizeObserver = new ResizeObserver(() => {
    updateCanvasSize();
  });
  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      isInView.value = entry.isIntersecting;
      animationFrameId = requestAnimationFrame(animate);
    },
    { threshold: 0 },
  );

  resizeObserver.observe(containerRef.value);
  intersectionObserver.observe(canvasRef.value);
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
});
</script>

<template>
  <div ref="containerRef" class="flickering-grid">
    <canvas
      ref="canvasRef"
      class="pointer-events-none"
      :width="canvasSize.width"
      :height="canvasSize.height"
    />
  </div>
</template>

<style scoped>
.flickering-grid {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
</style>
