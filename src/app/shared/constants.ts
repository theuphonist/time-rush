// API
export const API_URL = 'http://192.168.1.110:8080'; // eventually will be updated with a real domain
export const COMMON_HEADERS = {
  'Content-Type': 'application/json',
};

// WebSockets
export const WS_URL = 'http://192.168.1.110:8080/messaging';
export const BASE_INCOMING_WS_TOPIC = '/game';
export const BASE_OUTGOING_WS_TOPIC = '/timerush';
export const MAX_SUBSCRIBE_RETRIES = 5;

// Misc
export const DEFAULT_PLAYER_COLORS: `#${string}`[] = [
  '#F34141',
  '#F38141',
  '#F3CC41',
  '#38D048',
  '#4188F3',
  '#B041F3',
  '#F659CA',
  '#41D9FB',
  '#8E744D',
  '#D3D3D3',
  '#767676',
  '#181818',
];
export const LOCAL_GAME_ID = '_';
export const JOIN_CODE_REGEX = /^[a-zA-Z0-9]{4}$/;
