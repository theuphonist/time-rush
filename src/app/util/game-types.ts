import { Player } from './player-types';

export interface Game {
  id: string;
  name: string;
  turnLength: number;
  joinCode: string;
  status: GameStatuses;
  paused: boolean;
  hostPlayerId: Player['id'] | null;
  activePlayerId: Player['id'] | null;
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

export const GameStatusToRoute: Record<GameStatuses, `/${string}`> = {
  [GameStatuses.Pending]: '/lobby',
  [GameStatuses.Active]: '/active-game',

  // unused, but needed for type purposes
  [GameStatuses.Complete]: '/',
  [GameStatuses.Local]: '/',
};
