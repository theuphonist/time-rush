import {
  computed,
  effect,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { GameModel, LocalStorageKeys, TimeUnits } from '../shared/custom-types';
import { ApiService } from './api.service';
import { getRandomPlayerColor } from '../shared/helpers';
import { PlayerService } from './player.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly apiService = inject(ApiService);
  private readonly playerService = inject(PlayerService);

  private readonly _game: WritableSignal<GameModel>;
  readonly game = computed(() => this._game());

  constructor() {
    this._game = signal(
      (this.localStorageService.getItem(LocalStorageKeys.Game) ?? {
        name: '',
        turnLength: 0,
        turnLengthUnits: TimeUnits.Seconds,
        playerIds: [],
      }) as GameModel
    );
  }

  // update local storage whenever game info changes
  private readonly localStorageGameUpdateEffect = effect(() =>
    this.localStorageService.setItem(LocalStorageKeys.Game, this._game())
  );

  updateLocalGame(gameUpdates: Partial<GameModel>) {
    this._game.update((game) => ({ ...game, ...gameUpdates }));
  }

  async createGame(game: GameModel) {
    const hostPlayer = await this.playerService.createPlayer({
      name: 'Host',
      color: getRandomPlayerColor(),
    });

    let newGame: GameModel | undefined;

    if (hostPlayer?.id) {
      const _game: GameModel = {
        ...game,
        playerIds: [hostPlayer.id],
        hostPlayerId: hostPlayer.id,
      };

      newGame = await this.apiService.createGame(_game);
    }

    if (newGame) {
      this._game.set(newGame);
    }

    return newGame;
  }
}
