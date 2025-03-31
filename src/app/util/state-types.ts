import { Game, GameForm } from './game-types';
import { Player } from './player-types';

export type ActionFunction<T> = (args: T) => void | Promise<void>;

export interface TimeRushActions {
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
  connectToWebSocketServerFailed: ActionFunction<void>;
  subscribeToGameTopicFailed: ActionFunction<void>;
  createGameButtonClicked: ActionFunction<{ gameForm: GameForm }>;
  createGameFailed: ActionFunction<void>;
  createPlayerDuringGameCreationFailed: ActionFunction<void>;
  joinGameButtonClicked: ActionFunction<{ joinCode: Game['joinCode'] }>;
  findJoinCodeFailed: ActionFunction<{ joinCode: Game['joinCode'] }>;
}

export interface TimeRushState {
  playerId?: Player['id'];
  localPlayers?: Player[];
  onlinePlayers?: Player[];
  game?: Game;
}
