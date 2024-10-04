import {
  effect,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import { LocalStorageKeys, LocalStorageService } from './local-storage.service';

type GameModel = {
  game_name: string;
  turn_length: number;
};

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly localStorageService = inject(LocalStorageService);

  readonly gameInfo: WritableSignal<GameModel>;

  constructor() {
    this.gameInfo = signal(
      (this.localStorageService.getItem(LocalStorageKeys.Game) ??
        {}) as GameModel
    );
  }

  // update local storage whenever game info changes
  private readonly localStorageGameUpdateEffect = effect(() =>
    this.localStorageService.setItem(LocalStorageKeys.Game, this.gameInfo())
  );

  createGame(gameInfo: GameModel) {
    this.gameInfo.set(gameInfo);
  }
}
