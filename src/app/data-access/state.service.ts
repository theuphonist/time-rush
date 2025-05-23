import {
  computed,
  effect,
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { diff } from 'deep-object-diff';
import { MessageService } from 'primeng/api';
import { catchError, firstValueFrom, of } from 'rxjs';
import { ulid } from 'ulid';
import {
  LOCAL_GAME_ID,
  LOCAL_PLAYER_ID,
  MAX_DISPATCH_LOG_ENTRIES,
} from '../util/constants';
import {
  Game,
  GameStatuses,
  GameStatusToRoute,
  GameTypes,
} from '../util/game-types';
import {
  getRandomPlayerColor,
  isJoinable,
  isLocalPlayerId,
  isRejoinable,
} from '../util/helpers';
import { Player } from '../util/player-types';
import { SessionStorageKeys } from '../util/session-storage-types';
import {
  ActionFunction,
  DispatchLogEntry,
  TimeRushActions,
  TimeRushState,
} from '../util/state-types';
import { WebSocketActions, WebSocketTopics } from '../util/web-socket-types';
import { GameService } from './game.service';
import { PlayerService } from './player.service';
import { SessionStorageService } from './session-storage.service';
import { WebSocketService } from './web-socket.service';

const initialState = {
  loading: true,
};

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly gameService = inject(GameService);
  private readonly playerService = inject(PlayerService);

  private readonly state: WritableSignal<TimeRushState> = signal(initialState);

  constructor() {
    this.webSocketService.messages$
      .pipe(takeUntilDestroyed())
      .subscribe(({ topic, message }) => {
        if (topic.includes(WebSocketTopics.Connect)) {
          return;
        }
        if (message.action === WebSocketActions.PlayersOrGameUpdated) {
          this.dispatch(this.actions.wsPlayersOrGameUpdated, undefined);
          return;
        }
        if (message.action === WebSocketActions.TimerValueChanged) {
          const timerValue = message.data.timerValue;
          this.dispatch(this.actions.wsTimerValueChanged, { timerValue });
        }
      });
  }

  // Selectors
  readonly selectGame: Signal<TimeRushState['game']> = computed(
    () => this.state().game,
  );

  readonly selectPlayers: Signal<TimeRushState['players']> = computed(
    () => this.state().players,
  );

  readonly selectPlayerId: Signal<TimeRushState['playerId']> = computed(
    () => this.state().playerId,
  );

  readonly selectTimerValue: Signal<TimeRushState['timerValue']> = computed(
    () => this.state().timerValue,
  );

  readonly selectLoading: Signal<TimeRushState['loading']> = computed(
    () => this.state().loading,
  );

  readonly selectPlayer: Signal<Player | undefined> = computed(() =>
    this.state().players?.find((player) => player.id === this.selectPlayerId()),
  );

  readonly selectHostPlayerId: Signal<Player['id'] | undefined> = computed(
    () => this.state().game?.hostPlayerId ?? undefined,
  );

  readonly selectPlayerIds: Signal<Player['id'][]> = computed(
    () => this.state().players?.map((player) => player.id) ?? [],
  );

  readonly selectPlayerIsHost: Signal<boolean> = computed(
    () =>
      !!(
        this.state().playerId &&
        this.state().playerId === this.state().game?.hostPlayerId
      ),
  );

  readonly selectIsLocalGame: Signal<boolean> = computed(
    () => this.state().game?.id === LOCAL_GAME_ID,
  );

  readonly selectConnectedAndSortedPlayers: Signal<Player[]> = computed(
    () =>
      this.state()
        .players?.filter((player) => player.sessionId)
        ?.sort((player1, player2) => player1.position - player2.position) ?? [],
  );

  readonly selectActivePlayerIsConnected: Signal<boolean> = computed(
    () =>
      !!this.selectActivePlayerId() &&
      this.selectConnectedAndSortedPlayers().some(
        (player) => player.id === this.selectActivePlayerId(),
      ),
  );

  readonly selectActivePlayerId: Signal<Player['id'] | null> = computed(
    () => this.state().game?.activePlayerId ?? null,
  );

  readonly selectPlayerIsActive: Signal<boolean> = computed(
    () =>
      !!this.selectPlayerId() &&
      this.selectPlayerId() === this.selectActivePlayerId(),
  );

  // Actions
  readonly actions: TimeRushActions = {
    // initialization
    appInitialized: () => {
      const playerId = this.sessionStorageService.getItem(
        SessionStorageKeys.PlayerId,
      ) as Player['id'] | null;

      if (!playerId) {
        this.dispatch(
          this.actions.emptyPlayerIdRetrievedFromStorage,
          undefined,
        );

        return;
      }

      if (playerId === LOCAL_PLAYER_ID) {
        this.dispatch(this.actions.localPlayerIdRetrievedFromStorage, {
          playerId,
        });

        return;
      }

      this.dispatch(this.actions.onlinePlayerIdRetrievedFromStorage, {
        playerId,
      });
    },
    emptyPlayerIdRetrievedFromStorage: () => {
      this.state.update((prev) => ({
        ...prev,
        loading: false,
      }));

      this.router.navigate(['/']);
    },
    localPlayerIdRetrievedFromStorage: ({ playerId }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: false,
      }));

      const game = this.sessionStorageService.getItem(
        SessionStorageKeys.Game,
      ) as Game | undefined;

      if (!game) {
        this.dispatch(this.actions.initializeAppFailed, {
          errorDetail: 'Failed to load recent game data.',
        });
        return;
      }

      const players = (this.sessionStorageService.getItem(
        SessionStorageKeys.Players,
      ) ?? []) as Player[];

      this.state.update((prev) => ({
        ...prev,
        playerId,
        players,
        game,
        loading: false,
      }));
    },
    onlinePlayerIdRetrievedFromStorage: async ({ playerId }) => {
      // retrieve player and game data
      const player = await firstValueFrom(
        this.playerService
          .getOnlinePlayerById(playerId)
          .pipe(catchError(() => of(undefined))),
      );

      if (!player?.gameId) {
        this.dispatch(this.actions.initializeAppFailed, {
          errorDetail: 'Failed to load recent player data.',
        });
        return;
      }

      const game = await firstValueFrom(
        this.gameService
          .getGameById(player.gameId)
          .pipe(catchError(() => of(undefined))),
      );

      if (!game?.id) {
        this.dispatch(this.actions.initializeAppFailed, {
          errorDetail: 'Failed to load recent game data.',
        });
        return;
      }

      if (!isRejoinable(game)) {
        this.dispatch(this.actions.initializeAppFailed, {
          errorDetail: `Game "${game.name}" is no longer joinable.`,
        });
        return;
      }

      const players = await firstValueFrom(
        this.playerService
          .getOnlinePlayersByGameId(game.id)
          .pipe(catchError(() => of(undefined))),
      );

      if (!players) {
        this.dispatch(this.actions.initializeAppFailed, {
          errorDetail: `Failed to load players for game "${game.name}".`,
        });
        return;
      }

      // on iOS Safari (and possibly Android devices?), the websocket connection
      // isn't closed properly after screen lock.  calling disconnect() here ensures
      // the socket is closed before attempting to open it again
      this.webSocketService.disconnect();

      const webSocketConnectionEstablished =
        await this.webSocketService.connect(player.id, game.id);

      if (!webSocketConnectionEstablished) {
        this.dispatch(this.actions.initializeAppFailed, {
          errorDetail: 'Failed to connect to WebSocket server.',
        });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        playerId,
        players,
        game,
        loading: false,
      }));

      this.router.navigate([GameStatusToRoute[game.status]]);
    },
    initializeAppFailed: ({ errorDetail }) => {
      this.state.set({
        loading: false,
      });

      this.webSocketService.disconnect();

      this.messageService.add({
        severity: 'error',
        summary: 'Initialization Error',
        detail: errorDetail,
      });

      this.router.navigate(['/']);
    },

    // web sockets
    wsPlayersOrGameUpdated: async () => {
      const gameId = this.state().game?.id;

      if (!gameId) {
        return;
      }

      const game = await firstValueFrom(
        this.gameService
          .getGameById(gameId)
          .pipe(catchError(() => of(undefined))),
      );

      const players = await firstValueFrom(
        this.playerService
          .getOnlinePlayersByGameId(gameId)
          .pipe(catchError(() => of(undefined))),
      );

      if (!game || !players) {
        return;
      }

      const previousState = this.state();

      this.state.update((prev) => ({
        ...prev,
        game,
        players,
      }));

      // check for a follow-up action based on state change
      if (
        this.state().game?.status === GameStatuses.Active &&
        previousState.game?.status !== GameStatuses.Active
      ) {
        this.router.navigate(['/active-game']);
      }
    },
    wsTimerValueChanged: ({ timerValue }) => {
      if (this.selectPlayerIsActive()) {
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        timerValue,
      }));
    },

    // game
    createGameButtonClicked: async ({ gameForm }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: true,
      }));

      this.sessionStorageService.setItem(
        SessionStorageKeys.NewGameForm,
        gameForm,
      );

      // create local game
      if (gameForm.gameType === GameTypes.Local) {
        const createdLocalGame = this.gameService.createLocalGame(gameForm);
        const localPlayers =
          this.playerService.getLocalPlayersFromSessionStorage();

        this.state.update((prev) => ({
          ...prev,
          game: createdLocalGame,
          players: localPlayers,
          playerId: LOCAL_PLAYER_ID,
          loading: false,
        }));

        this.router.navigate(['/manage-players']);
        return;
      }

      // creat online game
      const createdGame = await firstValueFrom(
        this.gameService
          .createOnlineGame(gameForm)
          .pipe(catchError(() => of(undefined))),
      );

      if (!createdGame) {
        this.dispatch(this.actions.createGameFailed, {
          errorDetail: 'Server failed to respond.',
        });
        return;
      }

      // create host player
      const hostPlayer = await firstValueFrom(
        this.playerService
          .createOnlinePlayer({
            name: 'Host',
            color: getRandomPlayerColor(),
            gameId: createdGame.id,
          })
          .pipe(catchError(() => of(undefined))),
      );

      if (!hostPlayer) {
        this.dispatch(this.actions.createGameFailed, {
          errorDetail: 'Failed to create a host player for new game.',
        });
        return;
      }

      // establish WS connection
      const webSocketConnectionEstablished =
        await this.webSocketService.connect(hostPlayer.id, createdGame.id);

      if (!webSocketConnectionEstablished) {
        this.dispatch(this.actions.createGameFailed, {
          errorDetail: 'Failed to connect to WebSocket server.',
        });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        game: createdGame,
        playerId: hostPlayer.id,
        players: [hostPlayer],
        loading: false,
      }));

      this.router.navigate(['/lobby']);
    },
    createGameFailed: ({ errorDetail }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: false,
      }));

      this.messageService.add({
        severity: 'error',
        summary: 'Create Game Error',
        detail: errorDetail,
      });
    },
    startGameButtonClicked: async () => {
      this.state.update((prev) => ({
        ...prev,
        loading: true,
      }));

      const gameId = this.selectGame()?.id;

      if (!gameId) {
        this.dispatch(this.actions.startGameFailed, {
          errorDetail: 'Failed to load game data.',
        });
        return;
      }

      if (this.selectIsLocalGame()) {
        this.state.update((prev) => ({
          ...prev,
          loading: false,
        }));

        this.router.navigate(['/active-game']);
      }

      const updatedGame = await firstValueFrom(
        this.gameService
          .updateOnlineGame(gameId, {
            status: GameStatuses.Active,
          })
          .pipe(catchError(() => of(undefined))),
      );

      if (!updatedGame) {
        this.dispatch(this.actions.startGameFailed, {
          errorDetail: 'Server failed to respond.',
        });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        game: updatedGame,
        loading: false,
      }));

      this.router.navigate(['/active-game']);
    },
    startGameFailed: ({ errorDetail }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: false,
      }));

      this.messageService.add({
        severity: 'error',
        summary: 'Start Game Error',
        detail: errorDetail,
      });
    },
    leaveOnlineGameConfirmed: async () => {
      this.state.update((prev) => ({
        ...prev,
        loading: true,
      }));

      const playerId = this.state().playerId;

      if (playerId) {
        await firstValueFrom(this.playerService.deleteOnlinePlayer(playerId));
      }

      this.state.update((prev) => ({
        ...prev,
        playerId: undefined,
        game: undefined,
        players: undefined,
        loading: false,
      }));

      this.webSocketService.disconnect();
      this.router.navigate(['/']);
    },
    leaveLocalGameButtonClicked: () => {
      this.state.update((prev) => ({
        ...prev,
        game: undefined,
        players: undefined,
        playerId: undefined,
      }));
      this.router.navigate(['/new-game']);
    },
    joinGameButtonClicked: async ({ joinCode }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: true,
      }));

      const upperCaseJoinCode = joinCode.toUpperCase();

      const games = await firstValueFrom(
        this.gameService
          .getGamesByJoinCode(upperCaseJoinCode)
          .pipe(catchError(() => of(undefined))),
      );

      if (!games?.length) {
        this.dispatch(this.actions.joinGameFailed, {
          errorDetail: `Failed to find game with join code ${joinCode}.`,
        });
        return;
      }

      const game = games[0];

      if (!isJoinable(game)) {
        this.dispatch(this.actions.joinGameFailed, {
          errorDetail: `Game "${game.name}" is no longer joinable.`,
        });
        return;
      }

      const players = await firstValueFrom(
        this.playerService
          .getOnlinePlayersByGameId(game.id)
          .pipe(catchError(() => of(undefined))),
      );

      if (!players) {
        this.dispatch(this.actions.joinGameFailed, {
          errorDetail: `Failed to load players for game "${game.name}".`,
        });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        players,
        game,
        loading: false,
      }));

      this.router.navigate(['/new-player']);
    },
    joinGameFailed: ({ errorDetail }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: false,
      }));

      this.messageService.add({
        severity: 'error',
        summary: 'Join Game Error',
        detail: errorDetail,
      });
    },
    changeActivePlayerButtonClicked: async () => {
      this.state.update((prev) => ({
        ...prev,
        loading: true,
      }));

      const gameId = this.selectGame()?.id;

      if (!gameId) {
        this.dispatch(this.actions.changeActivePlayerFailed, {
          errorDetail: 'Failed to load game data.',
        });
        return;
      }

      const activePlayerId = this.selectActivePlayerId();
      const connectedAndSortedPlayers = this.selectConnectedAndSortedPlayers();

      const nextActivePlayerId = getNextActivePlayerId(
        activePlayerId,
        connectedAndSortedPlayers,
      );

      if (this.selectIsLocalGame()) {
        const updatedLocalGame = this.gameService.updateLocalGame({
          activePlayerId: nextActivePlayerId,
        });

        if (!updatedLocalGame) {
          this.dispatch(this.actions.changeActivePlayerFailed, {
            errorDetail: 'Failed to get game data from session storage.',
          });
          return;
        }

        this.state.update((prev) => ({
          ...prev,
          timerValue: updatedLocalGame.turnLength,
          game: updatedLocalGame,
        }));
        return;
      }

      const updatedGame = await firstValueFrom(
        this.gameService
          .updateOnlineGame(gameId, {
            activePlayerId: nextActivePlayerId,
          })
          .pipe(catchError(() => of(undefined))),
      );

      if (!updatedGame) {
        this.dispatch(this.actions.changeActivePlayerFailed, {
          errorDetail: 'Server failed to respond.',
        });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        timerValue: updatedGame.turnLength,
        game: updatedGame,
        loading: false,
      }));

      this.webSocketService.sendMessage(gameId, {
        action: WebSocketActions.TimerValueChanged,
        data: { timerValue: updatedGame.turnLength },
      });
    },
    changeActivePlayerFailed: ({ errorDetail }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: false,
      }));

      this.messageService.add({
        severity: 'error',
        summary: 'Change Player Error',
        detail: errorDetail,
      });
    },
    timerValueChanged: ({ timerValue }) => {
      if (!this.selectPlayerIsActive() && !this.selectIsLocalGame()) {
        return;
      }

      const gameId = this.selectGame()?.id;

      if (!gameId) {
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        timerValue,
      }));

      if (!this.selectIsLocalGame()) {
        this.webSocketService.sendMessage(gameId, {
          action: WebSocketActions.TimerValueChanged,
          data: { timerValue },
        });
      }
    },
    // TODO: store the current timer value, or have the active player emit
    // the "paused" time every second. otherwise, players who disconnect
    // before pause and reconnect after pause won't know how much time is left
    pauseButtonClicked: async () => {
      this.state.update((prev) => ({
        ...prev,
        loading: true,
      }));

      const game = this.selectGame();

      if (!game) {
        this.dispatch(this.actions.pauseGameFailed, {
          errorDetail: 'Failed to load game data.',
        });
        return;
      }

      if (this.selectIsLocalGame()) {
        const updatedLocalGame = this.gameService.updateLocalGame({
          paused: !game.paused,
        });

        if (!updatedLocalGame) {
          this.dispatch(this.actions.pauseGameFailed, {
            errorDetail: 'Failed to get game data from session storage.',
          });
          return;
        }

        this.state.update((prev) => ({
          ...prev,
          loading: false,
          game: updatedLocalGame,
        }));
        return;
      }

      const updatedGame = await firstValueFrom(
        this.gameService
          .updateOnlineGame(game.id, {
            paused: !game.paused,
          })
          .pipe(catchError(() => of(undefined))),
      );

      if (!updatedGame) {
        this.dispatch(this.actions.pauseGameFailed, {
          errorDetail: 'Server failed to respond.',
        });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        loading: false,
        game: updatedGame,
      }));
    },
    pauseGameFailed: ({ errorDetail }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: false,
      }));

      this.messageService.add({
        severity: 'error',
        summary: 'Pause Game Error',
        detail: errorDetail,
      });
    },

    // player
    createPlayerButtonClicked: async ({ playerForm }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: true,
      }));

      const game = this.state().game;

      if (!game) {
        this.dispatch(this.actions.createPlayerFailed, {
          errorDetail: 'Failed to load game data.',
        });
        return;
      }

      if (this.selectIsLocalGame()) {
        const createdLocalPlayer =
          this.playerService.createLocalPlayer(playerForm);

        this.state.update((prev) => ({
          ...prev,
          players: [...(prev.players ?? []), createdLocalPlayer],
          loading: false,
        }));

        this.router.navigate(['/manage-players']);
        return;
      }

      if (!isJoinable(game)) {
        this.dispatch(this.actions.createPlayerFailed, {
          errorDetail: `Game "${game.name}" is no longer joinable.`,
        });
        return;
      }

      const createdPlayer = await firstValueFrom(
        this.playerService
          .createOnlinePlayer({
            ...playerForm,
            gameId: game.id,
          })
          .pipe(catchError(() => of(undefined))),
      );

      if (!createdPlayer) {
        this.dispatch(this.actions.createPlayerFailed, {
          errorDetail: 'Server failed to respond.',
        });
        return;
      }

      // establish WS connection
      const webSocketConnectionEstablished =
        await this.webSocketService.connect(createdPlayer.id, game.id);

      if (!webSocketConnectionEstablished) {
        this.dispatch(this.actions.createPlayerFailed, {
          errorDetail: 'Failed to connect to WebSocket server.',
        });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        playerId: createdPlayer.id,
        players: [...(prev.players ?? []), createdPlayer],
        loading: false,
      }));

      this.router.navigate(['/lobby']);
    },
    createPlayerFailed: ({ errorDetail }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: false,
      }));

      this.messageService.add({
        severity: 'error',
        summary: 'Create Player Error',
        detail: errorDetail,
      });
    },
    playersReordered: async ({ playerIds }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: true,
      }));

      const originalPlayers = this.state().players;

      // optimistically set the state, it will be reverted if an online save fails
      this.state.update((prev) => ({
        ...prev,
        players:
          prev.players?.map((player) => ({
            ...player,
            position: playerIds.findIndex((playerId) => playerId === player.id),
          })) ?? [],
      }));

      if (this.selectIsLocalGame()) {
        const updatedLocalPlayers =
          this.playerService.reorderLocalPlayers(playerIds);

        this.state.update((prev) => ({
          ...prev,
          players: updatedLocalPlayers,
          loading: false,
        }));

        return;
      }

      const gameId = this.selectGame()?.id;

      if (!gameId) {
        this.dispatch(this.actions.reorderPlayersFailed, {
          errorDetail: 'Failed to load game data.',
          originalPlayers,
        });
        return;
      }

      const updatedPlayers = await firstValueFrom(
        this.playerService
          .reorderOnlinePlayers(gameId, playerIds)
          .pipe(catchError(() => of(undefined))),
      );

      if (!updatedPlayers) {
        this.dispatch(this.actions.reorderPlayersFailed, {
          errorDetail: 'Server failed to respond.',
          originalPlayers,
        });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        players: updatedPlayers,
        loading: false,
      }));
    },
    reorderPlayersFailed: ({ errorDetail, originalPlayers }) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Reorder Players Error',
        detail: errorDetail,
      });

      this.state.update((prev) => ({
        ...prev,
        players: originalPlayers,
        loading: false,
      }));
    },
    updatePlayerButtonClicked: async ({ playerId, playerForm }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: true,
      }));

      if (isLocalPlayerId(playerId)) {
        const updatedLocalPlayer = this.playerService.updateLocalPlayer(
          playerId,
          playerForm,
        );

        if (!updatedLocalPlayer) {
          this.dispatch(this.actions.updatePlayerFailed, {
            errorDetail: `Failed to find player with ID ${playerId}.`,
          });
          return;
        }

        this.state.update((prev) => ({
          ...prev,
          players: prev.players?.map((player) =>
            player.id === playerId
              ? {
                  ...updatedLocalPlayer,
                }
              : player,
          ),
          loading: false,
        }));

        this.router.navigate(['/manage-players']);
        return;
      }

      const updatedPlayer = await firstValueFrom(
        this.playerService
          .updateOnlinePlayer(playerId, playerForm)
          .pipe(catchError(() => of(undefined))),
      );

      if (!updatedPlayer) {
        this.dispatch(this.actions.updatePlayerFailed, {
          errorDetail: 'Server failed to respond.',
        });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        players: prev.players?.map((player) =>
          player.id === playerId ? { ...updatedPlayer } : player,
        ),
        loading: false,
      }));

      this.router.navigate(['/lobby']);
    },
    updatePlayerFailed: ({ errorDetail }) => {
      this.state.update((prev) => ({
        ...prev,
        loading: false,
      }));

      this.messageService.add({
        severity: 'error',
        summary: 'Update Player Error',
        detail: errorDetail,
      });
    },
    deletePlayerConfirmed: ({ playerId }) => {
      const deletedPlayer = this.playerService.deleteLocalPlayer(playerId);

      if (deletedPlayer) {
        this.state.update((prev) => ({
          ...prev,
          players: prev.players?.filter(
            (player) => player.id !== deletedPlayer.id,
          ),
        }));
      }
    },
  };

  // Effects
  private readonly updateSessionStorageOnPlayerIdUpdates = effect(() =>
    this.sessionStorageService.setItem(
      SessionStorageKeys.PlayerId,
      this.selectPlayerId() ?? null,
    ),
  );

  dispatch<T>(action: ActionFunction<T>, args: T) {
    const timestamp = new Date();
    const originalState = this.state();
    const promiseOrVoid = action(args);

    if (promiseOrVoid) {
      promiseOrVoid.then(() =>
        this.addEntryToDispatchLog({
          id: ulid(),
          dispatchTimestamp: timestamp,
          resolveTimestamp: new Date(),
          actionName: action.name,
          diff: diff(originalState, this.state()),
        }),
      );
      return;
    }

    this.addEntryToDispatchLog({
      id: ulid(),
      dispatchTimestamp: timestamp,
      resolveTimestamp: new Date(),
      actionName: action.name,
      diff: diff(originalState, this.state()),
    });
  }

  private addEntryToDispatchLog(entry: DispatchLogEntry) {
    const numberOfEntries = this.dispatchLog().unshift(entry);

    if (numberOfEntries > MAX_DISPATCH_LOG_ENTRIES) {
      this.dispatchLog().pop();
    }
  }

  readonly dispatchLog: WritableSignal<DispatchLogEntry[]> = signal([]);
}

function getNextActivePlayerId(
  currentActivePlayerId: Game['activePlayerId'],
  players: Player[],
) {
  if (!players.length) {
    return null;
  }

  if (!currentActivePlayerId) {
    return players[0].id;
  }

  const currentActivePlayerIndex = players.findIndex(
    (player) => player.id === currentActivePlayerId,
  );

  if (
    currentActivePlayerIndex < 0 ||
    currentActivePlayerIndex >= players.length - 1
  ) {
    return players[0].id;
  }

  return players[currentActivePlayerIndex + 1].id;
}
