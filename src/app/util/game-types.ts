import { Player } from './player-types';

export interface Game {
  id: string;
  name: string;
  turnLength: number;
  turnLengthUnits: TimeUnits;
  joinCode: string;
  status: GameStatuses;
  hostPlayerId: Player['id'];
  createdAt: Date;
}

export interface GameForm {
  name: string;
  turnLength: number;
  turnLengthUnits: TimeUnits;
  gameType: GameTypes;
}

export enum GameTypes {
  Local = 'local',
  Online = 'online',
}

export enum GameStatuses {
  Pending = 'pending',
  Active = 'active',
  Complete = 'complete',
  Local = '__localgamestate__',
}

export enum TimeUnits {
  Seconds = 's',
  Minutes = 'min',
}
