import {
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
} from '../shared/types';
import { ApiService } from './api.service';
import { SessionStorageService } from './session-storage.service';
import { LOCAL_GAME_ID } from '../shared/constants';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly apiService = inject(ApiService);
  private readonly sessionStorageService = inject(SessionStorageService);

  readonly game: WritableSignal<GameModel> = signal({
    id: LOCAL_GAME_ID,
    name: 'Time Rush',
    turnLength: 30,
    turnLengthUnits: TimeUnits.Seconds,
    joinCode: '_',
    hostPlayerId: '_',
  });

  constructor() {
    const savedGame = this.sessionStorageService.getItem(
      SessionStorageKeys.Game
    ) as GameModel | undefined;

    if (savedGame) {
      this.game.set(savedGame);
    }
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
    }

    return _newGame;
  }

  async getGameByJoinCode(joinCode: string): Promise<GameModel | undefined> {
    const game = await this.apiService.getGameByJoinCode(joinCode);

    if (game) {
      this.game.set(game);
    }

    return game;
  }

  // Local Game CRUD
  createLocalGame(newGame: GameFormViewModel): void {
    this.game.set({
      ...newGame,
      id: LOCAL_GAME_ID,
      joinCode: '_',
    });
  }
}
