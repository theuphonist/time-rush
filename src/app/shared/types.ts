import { FormControl, FormGroup } from '@angular/forms';

// Utility
export type AutogeneratedProperties = 'id' | 'joinCode' | 'createdAt';
export type OmitAutogeneratedProperties<T> = Omit<T, AutogeneratedProperties>;
export type ToFormGroup<T> = FormGroup<{
  [K in keyof T]: FormControl<T[K] | null>;
}>;

// Game
export interface GameModel {
  id: string;
  name: string;
  turnLength: number;
  turnLengthUnits: TimeUnits;
  joinCode: string;
  createdAt?: Date;
}

export interface GameFormViewModel {
  name: string;
  turnLength: number;
  turnLengthUnits: TimeUnits;
  gameType: GameTypes;
}

export enum GameTypes {
  Local = 'local',
  Online = 'online',
}

export enum TimeUnits {
  Seconds = 's',
  Minutes = 'min',
}

// Player
export interface PlayerModel {
  id: string;
  name: string;
  color: string;
  gameId: string;
  isHost: boolean;
  position: number;
  isConnected?: boolean;
  createdAt?: Date;
}

export interface PlayerFormViewModel {
  name: string;
  color: string;
}

// WebSockets
export interface WebSocketMessage {
  action?: WebSocketActions;
  data?: WebSocketMessageData;
}

export interface WebSocketMessageData {
  playerId?: PlayerModel['id'] | null;
  activePlayerId?: PlayerModel['id'];
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

// API
export enum Endpoints {
  GAME = 'game',
  PLAYER = 'player',
}

// Misc
export enum SessionStorageKeys {
  // Game
  Game = 'game',
  NewGameForm = 'newGameForm',

  // Player
  Players = 'players',
  PlayerId = 'playerId',
}
