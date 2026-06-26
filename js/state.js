let state = {
  apiKey: '',
  demoMode: false,
  numPlayers: 3,
  players: [],
  pool: { GK:[], RB:[], RCB:[], LCB:[], LB:[], MedioI:[], MedioC:[], MedioD:[], RW:[], LW:[], ST:[] },
  positionOrder: ['GK','RB','RCB','LCB','LB','MedioI','MedioC','MedioD','RW','LW','ST'],
  positionSkips: { GK:0, RB:0, RCB:0, LCB:0, LB:0, MedioI:0, MedioC:0, MedioD:0, RW:0, LW:0, ST:0 },
  timerPaused: false,
  extensionsUsed: 0,
  tradeMode: false,
  tradeRound: 0,
  currentPosIdx: 0,
  currentPlayerIdx: 0,
  currentBid: 0,
  currentLeader: null,
  timerInterval: null,
  timerLeft: TIMER_SECS,
  auctionLog: [],
  auctionFinished: false,
  tradeLog: [],
  chosenWinnerIdx: null,
  votes: {},
  votePoints: [],
  votingFinished: false,
};

// Accesores
function currentPos()        { return state.positionOrder[state.currentPosIdx]; }
function currentPool()       { return state.pool[currentPos()] || []; }
function currentPlayerData() { return currentPool()[state.currentPlayerIdx]; }