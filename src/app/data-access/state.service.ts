import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, firstValueFrom, of } from 'rxjs';
import { ulid } from 'ulid';
import {
  LOCAL_CREATED_AT,
  LOCAL_GAME_ID,
  LOCAL_PLAYER_PREFIX,
  LOCAL_SESSION_ID,
  MAX_DISPATCH_LOG_ENTRIES,
} from '../util/constants';
import { Game, GameTypes } from '../util/game-types';
import {
  getRandomPlayerColor,
  isJoinable,
  isLocalPlayerId,
} from '../util/helpers';
import { Player } from '../util/player-types';
import { SessionStorageKeys } from '../util/session-storage-types';
import {
  ActionFunction,
  DispatchLogEntry,
  TimeRushActions,
  TimeRushState,
} from '../util/state-types';
import { WebSocketActions } from '../util/web-socket-types';
import { GameService } from './game.service';
import { PlayerService } from './player.service';
import { SessionStorageService } from './session-storage.service';
import { WebSocketService } from './web-socket.service';

const initialState = {};

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
      .subscribe((message) => {
        if (message.action === WebSocketActions.PlayersOrGameUpdated) {
          this.dispatch(this.actions.wsPlayersOrGameUpdated, undefined);
          return;
        }

        if (message.action === WebSocketActions.GameStarted) {
          this.dispatch(this.actions.wsGameStarted, undefined);
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

      if (isLocalPlayerId(playerId)) {
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
      this.router.navigate(['/']);
    },
    localPlayerIdRetrievedFromStorage: ({ playerId }) => {
      const players = this.sessionStorageService.getItem(
        SessionStorageKeys.Players,
      ) as Player[] | undefined;

      if (!players) {
        this.dispatch(this.actions.initializeAppFailed, {
          errorDetail: 'Failed to load recent player data.',
        });
        return;
      }

      const game = this.sessionStorageService.getItem(
        SessionStorageKeys.Game,
      ) as Game | undefined;

      if (!game) {
        this.dispatch(this.actions.initializeAppFailed, {
          errorDetail: 'Failed to load recent game data.',
        });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        playerId,
        players,
        game,
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

      if (!isJoinable(game)) {
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

      // establish WS connection
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
      }));

      this.router.navigate(['/lobby']);
    },
    initializeAppFailed: ({ errorDetail }) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Initializion Error',
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

      this.state.update((prev) => ({
        ...prev,
        game,
        players,
      }));
    },
    // TODO: handle this action
    wsGameStarted: () => {},

    // game
    createGameButtonClicked: async ({ gameForm }) => {
      this.sessionStorageService.setItem(
        SessionStorageKeys.NewGameForm,
        gameForm,
      );

      // create game
      if (gameForm.gameType === GameTypes.Local) {
        this.state.update((prev) => ({
          ...prev,
          game: this.gameService.createLocalGame(gameForm),
        }));
        this.router.navigate(['/manage-players']);
        return;
      }

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
      }));

      this.router.navigate(['/lobby']);
    },
    createGameFailed: ({ errorDetail }) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Create Game Error',
        detail: errorDetail,
      });
    },
    // TODO: handle this action
    startGameButtonClicked: () => {},
    leaveGameConfirmed: async () => {
      const playerId = this.state().playerId;

      if (!playerId) {
        this.state.update((prev) => ({
          ...prev,
          playerId: undefined,
          game: undefined,
          players: undefined,
        }));

        this.webSocketService.disconnect();
        this.router.navigate(['/']);
        return;
      }

      await firstValueFrom(this.playerService.deleteOnlinePlayer(playerId));

      this.state.update((prev) => ({
        ...prev,
        playerId: undefined,
        game: undefined,
        players: undefined,
      }));

      this.webSocketService.disconnect();
      this.router.navigate(['/']);
    },
    joinGameButtonClicked: async ({ joinCode }) => {
      const upperCaseJoinCode = joinCode.toUpperCase();

      const games = await firstValueFrom(
        this.gameService
          .getGamesByJoinCode(upperCaseJoinCode)
          .pipe(catchError(() => of(undefined))),
      );

      if (!games?.length) {
        this.dispatch(this.actions.joinGameFailed, {
          errorDetail: `Could not find game with join code ${joinCode}.`,
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
      }));

      this.router.navigate(['/new-player']);
    },
    joinGameFailed: ({ errorDetail }) =>
      this.messageService.add({
        severity: 'error',
        summary: 'Join Game Error',
        detail: errorDetail,
      }),

    // player
    createPlayerButtonClicked: async ({ playerForm }) => {
      const game = this.state().game;

      if (!game) {
        this.dispatch(this.actions.createPlayerFailed, {
          errorDetail: 'Failed to load game data.',
        });
        return;
      }

      if (this.selectIsLocalGame()) {
        this.state.update((prev) => ({
          ...prev,
          players: [
            ...(prev.players ?? []),
            {
              ...playerForm,
              id: `${LOCAL_PLAYER_PREFIX}${ulid()}`,
              position:
                Math.max(
                  ...(prev.players?.map((player) => player.position) ?? [-1]),
                ) + 1,
              gameId: LOCAL_GAME_ID,
              sessionId: LOCAL_SESSION_ID,
              createdAt: LOCAL_CREATED_AT,
            },
          ],
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
      }));

      this.router.navigate(['/lobby']);
    },
    createPlayerFailed: ({ errorDetail }) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Create Player Error',
        detail: errorDetail,
      });
    },
    playersReordered: async ({ playerIds }) => {
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
      }));
    },
    updatePlayerButtonClicked: async ({ playerId, playerForm }) => {
      if (isLocalPlayerId(playerId)) {
        this.state.update((prev) => ({
          ...prev,
          players: prev.players?.map((player) =>
            player.id === playerId
              ? {
                  ...player,
                  ...playerForm,
                }
              : player,
          ),
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
      }));

      this.router.navigate(['/lobby']);
    },
    updatePlayerFailed: ({ errorDetail }) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Update Player Error',
        detail: errorDetail,
      });
    },
  };

  // Signal Effects
  private readonly updateSessionStorageOnPlayerIdUpdates = effect(() =>
    this.sessionStorageService.setItem(
      SessionStorageKeys.PlayerId,
      this.selectPlayerId() ?? null,
    ),
  );

  private readonly updateSessionStorageOnLocalPlayerUpdates = effect(() => {
    if (this.selectIsLocalGame()) {
      this.sessionStorageService.setItem(
        SessionStorageKeys.Players,
        this.selectPlayers() ?? null,
      );
    }
  });

  private readonly updateSessionStorageOnLocalGameUpdates = effect(() => {
    if (this.selectIsLocalGame() || !this.selectGame()) {
      this.sessionStorageService.setItem(
        SessionStorageKeys.Game,
        this.selectGame() ?? null,
      );
    }
  });

  dispatch<T>(action: ActionFunction<T>, args: T) {
    const timestamp = new Date();
    const promiseOrVoid = action(args);

    if (promiseOrVoid) {
      promiseOrVoid.then(() =>
        this.addEntryToDispatchLog({
          id: ulid(),
          dispatchTimestamp: timestamp,
          resolveTimestamp: new Date(),
          actionName: action.name,
          stateSnapshot: this.state(),
        }),
      );
      return;
    }

    this.addEntryToDispatchLog({
      id: ulid(),
      dispatchTimestamp: timestamp,
      resolveTimestamp: new Date(),
      actionName: action.name,
      stateSnapshot: this.state(),
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
