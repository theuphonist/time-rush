import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, firstValueFrom, of } from 'rxjs';
import { BASE_INCOMING_WS_TOPIC, LOCAL_PLAYER_ID } from '../util/constants';
import { Game, GameTypes } from '../util/game-types';
import { getRandomPlayerColor, isJoinable } from '../util/helpers';
import { Player } from '../util/player-types';
import { SessionStorageKeys } from '../util/session-storage-types';
import {
  ActionFunction,
  TimeRushActions,
  TimeRushState,
} from '../util/state-types';
import { WebSocketTopics } from '../util/web-socket-types';
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

  // Selectors
  readonly selectGame: Signal<TimeRushState['game']> = computed(
    () => this.state().game
  );

  readonly selectLocalPlayers: Signal<TimeRushState['localPlayers']> = computed(
    () => this.state().localPlayers
  );

  readonly selectOnlinePlayers: Signal<TimeRushState['onlinePlayers']> =
    computed(() => this.state().onlinePlayers);

  readonly selectPlayerId: Signal<TimeRushState['playerId']> = computed(
    () => this.state().playerId
  );

  readonly selectPlayer: Signal<Player | undefined> = computed(() =>
    this.state().onlinePlayers?.find((player) => player.id)
  );

  readonly actions: TimeRushActions = {
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
      const localPlayers = (this.sessionStorageService.getItem(
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
        localPlayers,
        game,
      }));
    },
    onlinePlayerIdRetrievedFromStorage: async ({ playerId }) => {
      // Retrieve player and game data
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

      const onlinePlayers = await firstValueFrom(
        this.playerService
          .getOnlinePlayersByGameId(game.id)
          .pipe(catchError(() => of(undefined)))
      );

      if (!onlinePlayers) {
        this.dispatch(this.actions.loadOnlinePlayersFailed, { game });
        return;
      }

      // Establish WS connection
      const webSocketConnectionEstablished =
        await this.webSocketService.connect();

      if (!webSocketConnectionEstablished) {
        this.dispatch(this.actions.connectToWebSocketServerFailed, undefined);
      }

      try {
        this.webSocketService.subscribe(
          `${BASE_INCOMING_WS_TOPIC}/${WebSocketTopics.Game}/${game.id}`
        );
      } catch {
        this.dispatch(this.actions.subscribeToGameTopicFailed, undefined);
      }

      this.state.update((prev) => ({
        ...prev,
        playerId,
        onlinePlayers,
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
    connectToWebSocketServerFailed: () => {
      this.router.navigate(['/']);
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to join game',
        detail: 'Failed to connect to WebSocket server.',
      });
    },
    subscribeToGameTopicFailed: () => {
      this.router.navigate(['/']);
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to join game',
        detail: 'Failed to subscribe to WebSocket messages.',
      });
    },
    createGameButtonClicked: async ({ gameForm }) => {
      this.sessionStorageService.setItem(
        SessionStorageKeys.NewGameForm,
        gameForm
      );

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

      const hostPlayer = await firstValueFrom(
        this.playerService
          .createOnlinePlayer({
            name: 'Host',
            color: getRandomPlayerColor(),
            gameId: createdGame.id,
            position: 0,
            isConnected: true,
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

      this.state.update((prev) => ({
        ...prev,
        game: createdGame,
        playerId: hostPlayer.id,
        onlinePlayers: [hostPlayer],
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

      const onlinePlayers = await firstValueFrom(
        this.playerService
          .getOnlinePlayersByGameId(game.id)
          .pipe(catchError(() => of(undefined)))
      );

      if (!onlinePlayers) {
        this.dispatch(this.actions.loadOnlinePlayersFailed, { game });
        return;
      }

      this.state.update((prev) => ({
        ...prev,
        onlinePlayers,
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
  };

  dispatch<T>(action: ActionFunction<T>, args: T) {
    console.log(`[${new Date().toLocaleString()}] Dispatched ${action.name}`);
    action(args);
  }
}
