import {
  computed,
  effect,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import { LocalStorageKeys, LocalStorageService } from './local-storage.service';

export type GameModel = {
  game_name: string;
  turn_length: number;
  time_units: TimeUnits;
};

export enum TimeUnits {
  Seconds = 's',
  Minutes = 'min',
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly localStorageService = inject(LocalStorageService);

  private readonly _gameInfo: WritableSignal<GameModel>;
  readonly gameInfo = computed(() => this._gameInfo());

  constructor() {
    this._gameInfo = signal(
      (this.localStorageService.getItem(LocalStorageKeys.Game) ??
        {}) as GameModel
    );
  }

  // update local storage whenever game info changes
  private readonly localStorageGameUpdateEffect = effect(() =>
    this.localStorageService.setItem(LocalStorageKeys.Game, this._gameInfo())
  );

  updateGameInfo(gameInfoUpdates: Partial<GameModel>) {
    this._gameInfo.update((gameInfo) => ({ ...gameInfo, ...gameInfoUpdates }));
  }
}
