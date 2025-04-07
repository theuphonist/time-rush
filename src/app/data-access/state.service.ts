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
  LOCAL_PLAYER_ID,
  LOCAL_SESSION_ID,
} from '../util/constants';
import { Game, GameTypes } from '../util/game-types';
import { getRandomPlayerColor, isJoinable } from '../util/helpers';
import { Player } from '../util/player-types';
import { SessionStorageKeys } from '../util/session-storage-types';
import {
  ActionFunction,
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
    () => this.state().game
  );

  readonly selectPlayers: Signal<TimeRushState['players']> = computed(
    () => this.state().players
  );

  readonly selectPlayerId: Signal<TimeRushState['playerId']> = computed(
    () => this.state().playerId
  );

  readonly selectPlayer: Signal<Player | undefined> = computed(() =>
    this.state().players?.find((player) => player.id === this.selectPlayerId())
  );

  readonly selectHostPlayerId: Signal<Player['id'] | undefined> = computed(
    () => this.state().game?.hostPlayerId ?? undefined
  );

  readonly selectPlayerIsHost: Signal<boolean> = computed(
    () =>
      !!(
        this.state().playerId &&
        this.state().playerId === this.state().game?.hostPlayerId
      )
  );

  readonly selectIsLocalGame: Signal<boolean> = computed(
    () => this.state().game?.id === LOCAL_GAME_ID
  );

  readonly selectConnectedAndSortedPlayers: Signal<Player[]> = computed(
    () =>
      this.state()
        .players?.filter((player) => player.sessionId)
        ?.sort((player1, player2) => player1.position - player2.position) ?? []
  );

  // Actions
  readonly actions: TimeRushActions = {
    // initialization
    appInitialized: () => {
      const playerId = this.sessionStorageService.getItem(
        SessionStorageKeys.PlayerId
      ) as Player['id'] | null;

      if (!playerId) {
        this.dispatch(
          this.actions.emptyPlayerIdRetrievedFromStorage,
          undefined
        );
        return;
      }

      if (playerId === LOCAL_PLAYER_ID) {
        this.dispatch(
          this.actions.localPlayerIdRetrievedFromStorage,
          undefined
        );
        return;
      }

      this.dispatch(this.actions.onlinePlayerIdRetrievedFromStorage, {
        playerId,
      });
    },
    emptyPlayerIdRetrievedFromStorage: () => {
      this.router.navigate(['/']);
    },
    localPlayerIdRetrievedFromStorage: () => {
      const players = (this.sessionStorageService.getItem(
        SessionStorageKeys.Players
      ) ?? []) as Player[];

      const game = this.sessionStorageService.getItem(
        SessionStorageKeys.Game
      ) as Game | undefined;

      if (!game) {
        this.dispatch(this.actions.loadGameFailed, undefined);
      }

      this.state.update((prev) => ({
        ...prev,
        playerId: LOCAL_PLAYER_ID,
        players,
        game,
      }));
    },
    onlinePlayerIdRetrievedFromStorage: async ({ playerId }) => {
      // retrieve player and game data
      const player = await firstValueFrom(
        this.playerService
          .getOnlinePlayerById(playerId)
          .pipe(catchError(() => of(undefined)))
      );

      if (!player?.gameId) {
        this.dispatch(this.actions.loadPlayerFailed, undefined);
        return;
      }

      const game = await firstValueFrom(
        this.gameService
          .getGameById(player.gameId)
          .pipe(catchError(() => of(undefined)))
      );

      if (!game?.id) {
        this.dispatch(this.actions.loadGameFailed, undefined);
        return;
      }

      if (!isJoinable(game)) {
        this.dispatch(this.actions.loadedUnjoinableGame, { game });
        return;
      }

      const players = await firstValueFrom(
        this.playerService
          .getOnlinePlayersByGameId(game.id)
          .pipe(catchError(() => of(undefined)))
      );

      if (!players) {
        this.dispatch(this.actions.loadOnlinePlayersFailed, { game });
        return;
      }

      // establish WS connection
      const webSocketConnectionEstablished =
        await this.webSocketService.connect(player.id, game.id);

      if (!webSocketConnectionEstablished) {
        this.dispatch(this.actions.connectToWebSocketServerFailed, {
          errorSummary: 'Unable to join game',
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
    loadPlayerFailed: () => {
      this.router.navigate(['/']);
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to join game',
        detail: 'Failed to load recent player data.',
      });
    },
    loadGameFailed: () => {
      this.router.navigate(['/']);
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to join game',
        detail: 'Failed to load recent game data.',
      });
    },
    loadedUnjoinableGame: ({ game }) => {
      this.router.navigate(['/']);
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to join game',
        detail: `Game "${game.name}" is no longer joinable.`,
      });
    },
    loadOnlinePlayersFailed: ({ game }) => {
      this.router.navigate(['/']);
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to join game',
        detail: `Failed to load players for game "${game.name}".`,
      });
    },

    // web sockets
    connectToWebSocketServerFailed: ({ errorSummary }) => {
      this.router.navigate(['/']);
      this.messageService.add({
        severity: 'error',
        summary: errorSummary,
        detail: 'Failed to connect to WebSocket server.',
      });
    },
    subscribeToGameTopicFailed: ({ errorSummary }) => {
      this.router.navigate(['/']);
      this.messageService.add({
        severity: 'error',
        summary: errorSummary,
        detail: 'Failed to subscribe to WebSocket messages.',
      });
    },
    wsPlayersOrGameUpdated: async () => {
      const gameId = this.state().game?.id;

      if (!gameId) {
        return;
      }

      const game = await firstValueFrom(
        this.gameService
          .getGameById(gameId)
          .pipe(catchError(() => of(undefined)))
      );

      const players = await firstValueFrom(
        this.playerService
          .getOnlinePlayersByGameId(gameId)
          .pipe(catchError(() => of(undefined)))
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
        gameForm
      );

      // create game
      if (gameForm.gameType === GameTypes.Local) {
        this.gameService.createLocalGame(gameForm);
        this.router.navigate(['/manage-players']);
        return;
      }

      const createdGame = await firstValueFrom(
        this.gameService
          .createOnlineGame(gameForm)
          .pipe(catchError(() => of(undefined)))
      );

      if (!createdGame) {
        this.dispatch(this.actions.createGameFailed, undefined);
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
          .pipe(catchError(() => of(undefined)))
      );

      if (!hostPlayer) {
        this.dispatch(
          this.actions.createPlayerDuringGameCreationFailed,
          undefined
        );
        return;
      }

      // establish WS connection
      const webSocketConnectionEstablished =
        await this.webSocketService.connect(hostPlayer.id, createdGame.id);

      if (!webSocketConnectionEstablished) {
        this.dispatch(this.actions.connectToWebSocketServerFailed, {
          errorSummary: 'Unable to create game',
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
    createGameFailed: () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Failed to create game',
        detail: 'An unknown error occurred.  Please try again.',
      });
    },
    createPlayerDuringGameCreationFailed: () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Failed to create game',
        detail:
          'Unable to create new player during game creation.  Please try again.',
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
          .pipe(catchError(() => of(undefined)))
      );

      if (!games?.length) {
        this.dispatch(this.actions.findJoinCodeFailed, {
          joinCode: upperCaseJoinCode,
        });
        return;
      }

      const game = games[0];

      if (!isJoinable(game)) {
        this.dispatch(this.actions.loadedUnjoinableGame, { game });
        return;
      }

      const players = await firstValueFrom(
        this.playerService
          .getOnlinePlayersByGameId(game.id)
          .pipe(catchError(() => of(undefined)))
      );

      if (!players) {
        this.dispatch(this.actions.loadOnlinePlayersFailed, { game });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        players,
        game,
      }));

      this.router.navigate(['/new-player']);
    },
    findJoinCodeFailed: ({ joinCode }) =>
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to join game',
        detail: `Could not find game with join code ${joinCode}.`,
      }),

    // player
    createPlayerButtonClicked: async ({ playerForm }) => {
      const game = this.state().game;

      if (!game) {
        this.dispatch(this.actions.loadGameFailed, undefined);
        return;
      }

      if (!isJoinable(game)) {
        this.dispatch(this.actions.loadedUnjoinableGame, { game });
        return;
      }

      if (this.state().game?.id === LOCAL_GAME_ID) {
        this.state.update((prev) => ({
          ...prev,
          players: [
            ...(prev.players ?? []),
            {
              ...playerForm,
              id: ulid(),
              position:
                Math.max(
                  ...(prev.players?.map((player) => player.position) ?? [-1])
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

      const createdPlayer = await firstValueFrom(
        this.playerService
          .createOnlinePlayer({
            ...playerForm,
            gameId: game.id,
          })
          .pipe(catchError(() => of(undefined)))
      );

      if (!createdPlayer) {
        this.dispatch(this.actions.createOnlinePlayerFailed, undefined);
        return;
      }

      // establish WS connection
      const webSocketConnectionEstablished =
        await this.webSocketService.connect(createdPlayer.id, game.id);

      if (!webSocketConnectionEstablished) {
        this.dispatch(this.actions.connectToWebSocketServerFailed, {
          errorSummary: 'Unable to join game',
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
    createOnlinePlayerFailed: () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Failed to create game',
        detail: 'An unknown error occurred.  Please try again.',
      });
    },
    // TODO: handle this action
    playersReordered: (event) => {},
  };

  // Signal Effects
  private readonly updateSessionStorageOnPlayerIdUpdates = effect(() =>
    this.sessionStorageService.setItem(
      SessionStorageKeys.PlayerId,
      this.selectPlayerId() ?? null
    )
  );

  private readonly updateSessionStorageOnLocalPlayerUpdates = effect(() => {
    if (this.state().game?.id === LOCAL_GAME_ID) {
      this.sessionStorageService.setItem(
        SessionStorageKeys.Players,
        this.selectPlayers() ?? null
      );
    }
  });

  dispatch<T>(action: ActionFunction<T>, args: T) {
    console.log(`[${new Date().toLocaleString()}] Dispatched ${action.name}`);
    action(args);

    console.log(this.state());
  }
}
