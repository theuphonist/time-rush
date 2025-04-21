import { Player } from './player-types';

export type WebSocketMessage =
  // actions that do NOT have associated data
  | {
      action: WebSocketActions.PlayersOrGameUpdated;
    }
  // actions that have associated data
  | {
      action: WebSocketActions.TimerValueChanged;
      data: {
        timerValue: number;
      };
    }
  | {
      action: WebSocketActions.Connect;
      data: {
        playerId: Player['id'];
      };
    };

export enum WebSocketActions {
  // incoming (from server)
  PlayersOrGameUpdated = 'playersOrGameUpdated',
  GameStarted = 'gameStarted',
  TimerValueChanged = 'timerValueChanged',
  Connect = 'connect',
}

export enum WebSocketTopics {
  Connect = 'connect',
}
