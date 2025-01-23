import {
  computed,
  effect,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  LocalStorageKeys,
  PlayerModel,
  PlayerFormViewModel,
} from '../shared/types';
import { ApiService } from './api.service';
import { LocalStorageService } from './local-storage.service';
import { ulid } from 'ulid';
import { moveItemInArray } from '@angular/cdk/drag-drop';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private readonly apiService = inject(ApiService);
  private readonly localStorageService = inject(LocalStorageService);

  constructor() {
    const savedPlayers = this.localStorageService.getItem(
      LocalStorageKeys.Players
    ) as PlayerModel[] | undefined;

    if (savedPlayers) {
      this.players.set(savedPlayers);
    }
  }

  readonly players: WritableSignal<PlayerModel[]> = signal([]);

  readonly updateLocalStorageOnPlayerUpdatesEffect = effect(() => {
    this.localStorageService.setItem(LocalStorageKeys.Players, this.players());
  });

  readonly activePlayerId: WritableSignal<PlayerModel['id'] | undefined> =
    signal(undefined);

  readonly nextPlayer = computed(() => {
    const players = this.players();

    if (!players) {
      return;
    }

    const activePlayerIndex = players.findIndex(
      (player) => player.id === this.activePlayerId()
    );

    if (activePlayerIndex === -1 || activePlayerIndex === players.length - 1) {
      return players[0];
    }

    return players[activePlayerIndex + 1];
  });

  changeActivePlayer(nextPlayerId?: PlayerModel['id']) {
    const players = this.players();

    if (!players) {
      return;
    }

    if (this.activePlayerId() === undefined) {
      this.activePlayerId.set(players[0].id);
      return;
    }

    if (nextPlayerId !== undefined) {
      this.activePlayerId.set(nextPlayerId);
      return;
    }

    const currentPlayerIndex = players.findIndex(
      (player) => player.id === this.activePlayerId()
    );

    const nextPlayerIndex =
      currentPlayerIndex + 1 >= players.length ? 0 : currentPlayerIndex + 1;

    this.activePlayerId.set(players[nextPlayerIndex].id);
  }

  createPlayer(newPlayer: PlayerFormViewModel) {
    const _newPlayer: PlayerModel = { ...newPlayer, id: ulid() };
    this.players.update((players) => [...players, _newPlayer]);
  }

  updatePlayer(
    playerId: PlayerModel['id'],
    updatedPlayer: PlayerFormViewModel
  ) {
    this.players.update((players) =>
      players.map((player) =>
        player.id === playerId ? { ...player, ...updatedPlayer } : player
      )
    );
  }

  deletePlayer(playerId: PlayerModel['id']) {
    this.players.update((players) =>
      players.filter((player) => player.id !== playerId)
    );
  }

  reorderPlayers(previousIndex: number, currentIndex: number) {
    const players = this.players();
    moveItemInArray(players, previousIndex, currentIndex);
    this.players.set(players);
  }
}
