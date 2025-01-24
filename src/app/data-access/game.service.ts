import {
  effect,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  GameModel,
  GameTypes,
  GameFormViewModel,
  LocalStorageKeys,
  TimeUnits,
} from '../shared/types';
import { ApiService } from './api.service';
import { getRandomPlayerColor } from '../shared/helpers';
import { PlayerService } from './player.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly apiService = inject(ApiService);
  private readonly playerService = inject(PlayerService);
  private readonly localStorageService = inject(LocalStorageService);

  readonly game: WritableSignal<GameModel> = signal({
    id: '_',
    name: 'Time Rush',
    turnLength: 30,
    turnLengthUnits: TimeUnits.Seconds,
    joinCode: '_',
    hostPlayerId: '_',
  });

  constructor() {
    const savedGame = this.localStorageService.getItem(
      LocalStorageKeys.Game
    ) as GameModel | undefined;

    if (savedGame) {
      this.game.set(savedGame);
    }
  }

  readonly updateLocalStorageOnGameUpdatesEffect = effect(() => {
    this.localStorageService.setItem(LocalStorageKeys.Game, this.game());
  });

  async createGame(newGame: GameFormViewModel): Promise<GameModel | undefined> {
    let _newGame: GameModel | undefined;
    if (newGame.gameType === GameTypes.Local) {
      _newGame = {
        ...newGame,
        id: '_',
        joinCode: '_',
      };
    } else {
      _newGame = await this.apiService.createGame(newGame);
    }

    if (_newGame) {
      this.game.set(_newGame);
    }

    return _newGame;
  }
}
