import { Game, GameForm } from './game-types';
import { Player, PlayerForm } from './player-types';

export type ActionFunction<T> = (args: T) => void | Promise<void>;

export interface TimeRushActions {
  // initialization
  appInitialized: ActionFunction<void>;
  emptyPlayerIdRetrievedFromStorage: ActionFunction<void>;
  localPlayerIdRetrievedFromStorage: ActionFunction<{
    playerId: Player['id'];
  }>;
  onlinePlayerIdRetrievedFromStorage: ActionFunction<{
    playerId: Player['id'];
  }>;
  initializeAppFailed: ActionFunction<{
    errorDetail: string;
  }>;

  // web sockets
  wsPlayersOrGameUpdated: ActionFunction<void>;
  wsGameStarted: ActionFunction<void>;

  // game
  createGameButtonClicked: ActionFunction<{ gameForm: GameForm }>;
  createGameFailed: ActionFunction<{
    errorDetail: string;
  }>;
  startGameButtonClicked: ActionFunction<void>;
  leaveGameConfirmed: ActionFunction<void>;
  joinGameButtonClicked: ActionFunction<{ joinCode: Game['joinCode'] }>;
  joinGameFailed: ActionFunction<{
    errorDetail: string;
  }>;

  //players
  createPlayerButtonClicked: ActionFunction<{
    playerForm: PlayerForm;
  }>;
  createPlayerFailed: ActionFunction<{
    errorDetail: string;
  }>;
  playersReordered: ActionFunction<{ playerIds: Player['id'][] }>;
  reorderPlayersFailed: ActionFunction<{
    errorDetail: string;
  }>;
  updatePlayerButtonClicked: ActionFunction<{
    playerId: Player['id'];
    playerForm: PlayerForm;
  }>;
  updatePlayerFailed: ActionFunction<{
    errorDetail: string;
  }>;
}

export interface TimeRushState {
  playerId?: Player['id'];
  players?: Player[];
  game?: Game;
}

export interface DispatchLogEntry {
  id: string;
  dispatchTimestamp: Date;
  resolveTimestamp: Date;
  actionName: string;
  stateSnapshot: TimeRushState;
}
