import { Player } from './player-types';

export interface WebSocketMessage {
  action?: WebSocketActions;
  data?: WebSocketMessageData;
}

export interface WebSocketMessageData {
  playerId?: Player['id'] | null;
  activePlayerId?: Player['id'];
}

export enum WebSocketActions {
  // Player Actions
  UpdatePlayer = 'updatePlayer',
  ChangeActivePlayer = 'changeActivePlayer',

  // Game Actions
  StartGame = 'gameStarted',
}

export enum WebSocketTopics {
  Game = 'game',
  MapSession = 'map-session',
  DeleteSession = 'delete-session',
}
