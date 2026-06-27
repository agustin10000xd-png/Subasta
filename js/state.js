let state = {
  apiKey: '',
  demoMode: false,
  numPlayers: 2,
  players: [],
  pool: { Arquero:[], LateralDerecho:[], CentralDerecho:[], CentralIzquierdo:[], LateralIzquierdo:[], MediocampistaIzquierdo:[], MediocampistaC:[], MediocampistaD:[], ExtremoDerecho:[], ExtremoIzquierdo:[], DelanteroC:[] },
  positionOrder: ['Arquero','LateralDerecho','CentralDerecho','CentralIzquierdo','LateralIzquierdo','MediocampistaIzquierdo','MediocampistaC','MediocampistaD','ExtremoDerecho','ExtremoIzquierdo','DelanteroC'],
  positionSkips: { Arquero:0, LateralDerecho:0, CentralDerecho:0, CentralIzquierdo:0, LateralIzquierdo:0, MediocampistaIzquierdo:0, MediocampistaC:0, MediocampistaD:0, ExtremoDerecho:0, ExtremoIzquierdo:0, DelanteroC:0 },
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