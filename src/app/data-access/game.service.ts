import {
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  GameModel,
  GameFormViewModel,
  SessionStorageKeys,
  TimeUnits,
  WebSocketActions,
  WebSocketMessage,
} from '../shared/types';
import { ApiService } from './api.service';
import { SessionStorageService } from './session-storage.service';
import {
  BASE_INCOMING_WS_TOPIC,
  BASE_OUTGOING_WS_TOPIC,
  LOCAL_GAME_ID,
} from '../shared/constants';
import { WebSocketService } from './web-socket.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly apiService = inject(ApiService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly game: WritableSignal<GameModel> = signal({
    id: LOCAL_GAME_ID,
    name: 'Time Rush',
    turnLength: 30,
    turnLengthUnits: TimeUnits.Seconds,
    joinCode: '_',
  });

  constructor() {
    const savedGame = this.sessionStorageService.getItem(
      SessionStorageKeys.Game
    ) as GameModel | undefined;

    if (savedGame) {
      this.game.set(savedGame);

      if (savedGame.id !== LOCAL_GAME_ID) {
        this.webSocketService.subscribe(
          `${BASE_INCOMING_WS_TOPIC}/${this.game().id}`
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
  async createOnlineGame(
    newGame: GameFormViewModel
  ): Promise<GameModel | undefined> {
    const _newGame = await this.apiService.createGame(newGame);

    if (_newGame) {
      this.game.set(_newGame);
      this.webSocketService.subscribe(
        `${BASE_INCOMING_WS_TOPIC}/${_newGame.id}`
      );
    }

    return _newGame;
  }

  async leaveOnlineGame() {
    this.game.set({
      id: LOCAL_GAME_ID,
      name: 'Time Rush',
      turnLength: 30,
      turnLengthUnits: TimeUnits.Seconds,
      joinCode: '_',
    });

    this.webSocketService.unsubscribeAll();
  }

  // TODO: disallow joining of "inactive" games
  async joinOnlineGame(joinCode: string): Promise<GameModel | undefined> {
    const game = await this.apiService.getGameByJoinCode(joinCode);

    if (game) {
      this.game.set(game);
      this.webSocketService.subscribe(`${BASE_INCOMING_WS_TOPIC}/${game.id}`);
    }

    return game;
  }

  async startOnlineGame() {
    this.webSocketService.sendMessage(
      `${BASE_OUTGOING_WS_TOPIC}/${this.game().id}`,
      { action: WebSocketActions.StartGame }
    );
  }

  // Local Game CRUD
  createLocalGame(newGame: GameFormViewModel): void {
    this.game.set({
      ...newGame,
      id: LOCAL_GAME_ID,
      joinCode: '_',
    });
  }

  // Misc
  async handleMessage(message: WebSocketMessage) {
    if (message.action === WebSocketActions.StartGame) {
      this.router.navigate(['/active-game']);
    }
  }
}
