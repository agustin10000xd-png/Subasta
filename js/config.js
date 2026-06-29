const PLAYER_COLORS = ['#00c853','#2979ff','#ff6d00','#d500f9','#ff1744'];
const COLOR_NAMES = ['Verde','Azul','Naranja','Violeta','Rojo'];
const PLAYER_ICONS = ['icon/verde.png','icon/azul.png','icon/naranja.png','icon/amarilla.png','icon/rojo.png'];
const POSITIONS_433 = [
  { key: 'Arquero',                 label: 'Arquero',                 count: 1, pitchY: 91, pitchXs: [50] },

  { key: 'CentralDerecho',          label: 'Central Derecho',         count: 1, pitchY: 73, pitchXs: [62] },
  { key: 'CentralIzquierdo',        label: 'Central Izquierdo',       count: 1, pitchY: 73, pitchXs: [38] },
  { key: 'LateralDerecho',          label: 'Lateral Derecho',         count: 1, pitchY: 66, pitchXs: [90] },
  { key: 'LateralIzquierdo',        label: 'Lateral Izquierdo',       count: 1, pitchY: 66, pitchXs: [10] },

  { key: 'MediocampistaC',          label: 'Mediocampista Centro',    count: 1, pitchY: 53, pitchXs: [50] },
  { key: 'MediocampistaIzquierdo',  label: 'Mediocampista Izquierdo', count: 1, pitchY: 41, pitchXs: [20] },
  { key: 'MediocampistaD',          label: 'Mediocampista Derecho',   count: 1, pitchY: 41, pitchXs: [80] },

  { key: 'DelanteroC',              label: 'Delantero Centro',        count: 1, pitchY: 13, pitchXs: [50] },
  { key: 'ExtremoIzquierdo',        label: 'Extremo Izquierdo',       count: 1, pitchY: 18, pitchXs: [15] },
  { key: 'ExtremoDerecho',          label: 'Extremo Derecho',         count: 1, pitchY: 18, pitchXs: [85] },
];
const BUDGET = 500;
const TIMER_SECS = 2;
const CIRCUMFERENCE = 2 * Math.PI * 22;
const EXTEND_SECS = 15;
const MAX_EXTENSIONS = 2;
const BUY_NOW_PREMIUM = 0;

// Position order matching data.js keys
const POSITION_KEYS = ['Arquero', 'LateralDerecho', 'CentralDerecho', 'CentralIzquierdo', 'LateralIzquierdo', 'MediocampistaIzquierdo', 'MediocampistaC', 'MediocampistaD', 'ExtremoDerecho', 'ExtremoIzquierdo', 'DelanteroC'];