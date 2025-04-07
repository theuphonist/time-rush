// API
// export const API_URL = 'https://api.timerush.app:8443';
export const API_URL = 'http://192.168.1.110:8080'; // uncomment if running backend locally
export const COMMON_HEADERS = {
  'Content-Type': 'application/json',
};

// WebSockets
// export const WS_URL = 'wss://api.timerush.app:8443/messaging';
export const WS_URL = 'http://192.168.1.110:8080/messaging'; // uncomment if running backend locally
export const BASE_INCOMING_WS_TOPIC = '/topic';
export const BASE_OUTGOING_WS_TOPIC = '/timerush';
export const MAX_SUBSCRIBE_RETRIES = 5;
export const MAX_SEND_RETRIES = 5;
export const CONNECTION_TIMEOUT = 2500;

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
export const JOIN_CODE_REGEX = /^[a-zA-Z0-9]{4}$/;

// Local Placeholders
export const LOCAL_GAME_ID = '__localgame__';
export const LOCAL_PLAYER_ID = '__localplayer__';
export const LOCAL_JOIN_CODE = '__localjoincode__';
export const LOCAL_CREATED_AT = new Date();
export const LOCAL_SESSION_ID = '__localsessionid__';
