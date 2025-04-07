import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Game, GameForm } from './game-types';
import { Player, PlayerForm } from './player-types';

export type ActionFunction<T> = (args: T) => void | Promise<void>;

export interface TimeRushActions {
  // initialization
  appInitialized: ActionFunction<void>;
  emptyPlayerIdRetrievedFromStorage: ActionFunction<void>;
  localPlayerIdRetrievedFromStorage: ActionFunction<void>;
  onlinePlayerIdRetrievedFromStorage: ActionFunction<{
    playerId: Player['id'];
  }>;
  loadPlayerFailed: ActionFunction<void>;
  loadGameFailed: ActionFunction<void>;
  loadedUnjoinableGame: ActionFunction<{ game: Game }>;
  loadOnlinePlayersFailed: ActionFunction<{ game: Game }>;

  // web sockets
  connectToWebSocketServerFailed: ActionFunction<{ errorSummary: string }>;
  subscribeToGameTopicFailed: ActionFunction<{ errorSummary: string }>;
  wsPlayersOrGameUpdated: ActionFunction<void>;
  wsGameStarted: ActionFunction<void>;

  // game
  createGameButtonClicked: ActionFunction<{ gameForm: GameForm }>;
  createGameFailed: ActionFunction<void>;
  createPlayerDuringGameCreationFailed: ActionFunction<void>;
  startGameButtonClicked: ActionFunction<void>;
  leaveGameConfirmed: ActionFunction<void>;
  joinGameButtonClicked: ActionFunction<{ joinCode: Game['joinCode'] }>;
  findJoinCodeFailed: ActionFunction<{ joinCode: Game['joinCode'] }>;

  //players
  createPlayerButtonClicked: ActionFunction<{
    playerForm: PlayerForm;
  }>;
  createOnlinePlayerFailed: ActionFunction<void>;
  playersReordered: ActionFunction<CdkDragDrop<string[]>>;
}

export interface TimeRushState {
  playerId?: Player['id'];
  players?: Player[];
  game?: Game;
}
