const PLAYER_COLORS = ['#00c853','#2979ff','#ff6d00','#d500f9','#ff1744'];
const COLOR_NAMES = ['Verde','Azul','Naranja','Violeta','Rojo'];
const POSITIONS_433 = [
  { key: 'GK',     label: 'Portero',                  count: 1, pitchY: 88, pitchXs: [50] },
  { key: 'RB',     label: 'Lateral Derecho',           count: 1, pitchY: 68, pitchXs: [85] },
  { key: 'RCB',    label: 'Central Derecho',           count: 1, pitchY: 68, pitchXs: [62] },
  { key: 'LCB',    label: 'Central Izquierdo',         count: 1, pitchY: 68, pitchXs: [38] },
  { key: 'LB',     label: 'Lateral Izquierdo',         count: 1, pitchY: 68, pitchXs: [15] },
  { key: 'MedioI', label: 'Mediocampista Izquierdo',   count: 1, pitchY: 45, pitchXs: [20] },
  { key: 'MedioC', label: 'Mediocampista Centro',      count: 1, pitchY: 45, pitchXs: [50] },
  { key: 'MedioD', label: 'Mediocampista Derecho',     count: 1, pitchY: 45, pitchXs: [80] },
  { key: 'RW',     label: 'Extremo Derecho',           count: 1, pitchY: 18, pitchXs: [80] },
  { key: 'LW',     label: 'Extremo Izquierdo',         count: 1, pitchY: 18, pitchXs: [20] },
  { key: 'ST',     label: 'Delantero Centro',          count: 1, pitchY: 18, pitchXs: [50] }
];
const BUDGET = 500;
const TIMER_SECS = 2;
const CIRCUMFERENCE = 2 * Math.PI * 22;
const EXTEND_SECS = 15;
const MAX_EXTENSIONS = 2;
const BUY_NOW_PREMIUM = 0;