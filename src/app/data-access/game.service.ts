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

  async createGame(newGame: GameFormViewModel) {
    if (newGame.gameType === GameTypes.Local) {
      this.game.set({ ...newGame, id: '_' });
      return newGame;
    }

    const _newGame = await this.apiService.createGame(newGame);

    // if (_newGame?.id) {
    //   const hostPlayer = await this.playerService.createPlayer({
    //     name: 'Host',
    //     color: getRandomPlayerColor(),
    //     isHost: true,
    //     gameId: _newGame.id,
    //   });

    //   if (hostPlayer) {
    //     this.game.set(newGame);
    //   }
    // }

    return newGame;
  }
}
