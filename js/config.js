const PLAYER_COLORS = ['#00c853','#2979ff','#ff6d00','#ffd600','#ff1744'];
const COLOR_NAMES = ['Verde','Azul','Naranja','Amarillo','Rojo'];
const PLAYER_ICONS = ['icon/verde.png','icon/azul.png','icon/naranja.png','icon/amarilla.png','icon/rojo.png'];
const POSITIONS_433 = [
  { key: 'Arquero',                 label: 'Arquero',                 count: 1, pitchY: 90, pitchXs: [50] },
  { key: 'LateralDerecho',          label: 'Lateral Derecho',         count: 1, pitchY: 68, pitchXs: [85] },
  { key: 'CentralDerecho',          label: 'Central Derecho',         count: 1, pitchY: 73, pitchXs: [62] },
  { key: 'CentralIzquierdo',        label: 'Central Izquierdo',       count: 1, pitchY: 73, pitchXs: [38] },
  { key: 'LateralIzquierdo',        label: 'Lateral Izquierdo',       count: 1, pitchY: 68, pitchXs: [15] },
  { key: 'MediocampistaIzquierdo',  label: 'Mediocampista Izquierdo', count: 1, pitchY: 44, pitchXs: [20] },
  { key: 'MediocampistaC',          label: 'MediocampistaCentro',     count: 1, pitchY: 53, pitchXs: [50] },
  { key: 'MediocampistaD',          label: 'MediocampistaDerecho',    count: 1, pitchY: 44, pitchXs: [80] },
  { key: 'ExtremoDerecho',          label: 'Extremo Derecho',         count: 1, pitchY: 20, pitchXs: [80] },
  { key: 'ExtremoIzquierdo',        label: 'Extremo Izquierdo',       count: 1, pitchY: 20, pitchXs: [20] },
  { key: 'DelanteroC',              label: 'DelanteroCentro',         count: 1, pitchY: 16, pitchXs: [50] }
];
let BUDGET = 500;
const BUDGET_MIN = 500;
const BUDGET_MAX = 1000;
const BUDGET_STEP = 50;
const TIMER_SECS = 2;
const CIRCUMFERENCE = 2 * Math.PI * 22;
const EXTEND_SECS = 15;
const MAX_EXTENSIONS = 2;
const BUY_NOW_PREMIUM = 0;

// Position order matching data.js keys
const POSITION_KEYS = ['Arquero', 'LateralDerecho', 'CentralDerecho', 'CentralIzquierdo', 'LateralIzquierdo', 'MediocampistaIzquierdo', 'MediocampistaC', 'MediocampistaD', 'ExtremoDerecho', 'ExtremoIzquierdo', 'DelanteroC'];