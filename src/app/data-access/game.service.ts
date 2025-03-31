import {
  DestroyRef,
  Injectable,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Endpoints } from '../util/api-types';
import {
  BASE_INCOMING_WS_TOPIC,
  BASE_OUTGOING_WS_TOPIC,
  LOCAL_CREATED_AT,
  LOCAL_GAME_ID,
  LOCAL_JOIN_CODE,
  LOCAL_PLAYER_ID,
} from '../util/constants';
import { Game, GameForm, GameStatuses, TimeUnits } from '../util/game-types';
import { SessionStorageKeys } from '../util/session-storage-types';
import {
  WebSocketActions,
  WebSocketMessage,
  WebSocketTopics,
} from '../util/web-socket-types';
import { ApiService } from './api.service';
import { SessionStorageService } from './session-storage.service';
import { WebSocketService } from './web-socket.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly apiService = inject(ApiService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly game: WritableSignal<Game> = signal({
    id: LOCAL_GAME_ID,
    name: 'Time Rush',
    turnLength: 30,
    turnLengthUnits: TimeUnits.Seconds,
    joinCode: '_',
    status: GameStatuses.Pending,
    hostPlayerId: 'foo',
    createdAt: new Date(),
  });

  readonly isLocalGame = computed(() => this.game().id === LOCAL_GAME_ID);

  constructor() {
    const savedGame = this.sessionStorageService.getItem(
      SessionStorageKeys.Game
    ) as Game | undefined;

    if (savedGame) {
      this.game.set(savedGame);

      if (savedGame.id !== LOCAL_GAME_ID) {
        this.webSocketService.subscribe(
          `${BASE_INCOMING_WS_TOPIC}/${WebSocketTopics.Game}/${this.game().id}`
        );
      }
    }

    this.webSocketService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => this.handleMessage(message));
  }

  readonly updateLocalStorageOnGameUpdatesEffect = effect(() => {
    this.sessionStorageService.setItem(SessionStorageKeys.Game, this.game());
  });

  // Online Game CRUD
  createOnlineGame(gameForm: GameForm): Observable<Game> {
    return this.apiService.post<Game>(Endpoints.GAME, gameForm);
  }

  getGameById(gameId: Game['id']): Observable<Game | null> {
    return this.apiService.get<Game | null>([Endpoints.GAME, gameId]);
  }

  getGamesByJoinCode(joinCode: Game['joinCode']): Observable<Game[]> {
    return this.apiService.get<Game[]>(Endpoints.GAME, {
      joinCode,
    });
  }

  async leaveOnlineGame() {
    this.webSocketService.unsubscribeAll();
  }

  async startOnlineGame() {
    this.webSocketService.sendMessage(
      `${BASE_OUTGOING_WS_TOPIC}/${WebSocketTopics.Game}/${this.game().id}`,
      { action: WebSocketActions.StartGame }
    );
  }

  // Local Game CRUD
  createLocalGame(newGame: GameForm): Game {
    return {
      ...newGame,
      id: LOCAL_GAME_ID,
      joinCode: LOCAL_JOIN_CODE,
      status: GameStatuses.Local,
      hostPlayerId: LOCAL_PLAYER_ID,
      createdAt: LOCAL_CREATED_AT,
    };
  }

  // Misc
  async handleMessage(message: WebSocketMessage) {
    if (message.action === WebSocketActions.StartGame) {
      this.router.navigate(['/active-game']);
    }
  }
}
