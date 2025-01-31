import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  PlayerModel,
  PlayerFormViewModel,
  GameModel,
  SessionStorageKeys,
  WebSocketActions,
  WebSocketMessage,
} from '../shared/types';
import { ApiService } from './api.service';
import { ulid } from 'ulid';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { GameService } from './game.service';
import { SessionStorageService } from './session-storage.service';
import { BASE_OUTGOING_WS_TOPIC, LOCAL_GAME_ID } from '../shared/constants';
import { WebSocketService } from './web-socket.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private readonly apiService = inject(ApiService);
  private readonly gameService = inject(GameService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly localPlayers: WritableSignal<PlayerModel[]>;
  readonly onlinePlayers: WritableSignal<PlayerModel[]>;
  readonly players = computed(() =>
    this.gameService.game().id === LOCAL_GAME_ID
      ? this.localPlayers()
      : this.onlinePlayers()
  );

  readonly player: WritableSignal<PlayerModel>;

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

  constructor() {
    this.localPlayers = signal(
      (this.sessionStorageService.getItem(SessionStorageKeys.Players) ??
        []) as PlayerModel[]
    );

    this.onlinePlayers = signal([]);

    this.player = signal(
      (this.sessionStorageService.getItem(SessionStorageKeys.Player) ?? {
        id: '',
        name: '',
        color: '',
        gameId: '',
        isHost: false,
      }) as PlayerModel
    );

    const savedGame = this.gameService.game();

    this.getOnlinePlayers(savedGame.id);

    this.webSocketService.messages$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((message) => message.from !== this.player().id)
      )
      .subscribe((message) => this.handleMessage(message));
  }

  readonly updateSessionStorageOnLocalPlayerUpdatesEffect = effect(() => {
    this.sessionStorageService.setItem(
      SessionStorageKeys.Players,
      this.localPlayers()
    );
  });

  readonly updateSessionStorageOnThisPlayerUpdates = effect(() => {
    this.sessionStorageService.setItem(
      SessionStorageKeys.Player,
      this.player()
    );
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

  // Online Player CRUD
  async createOnlinePlayer(
    newPlayer: PlayerFormViewModel,
    gameId: GameModel['id'],
    isHost: boolean = false
  ) {
    const _newPlayer = await this.apiService.createPlayer(
      newPlayer,
      gameId,
      isHost
    );

    if (_newPlayer) {
      this.onlinePlayers.update((players) => [...players, _newPlayer]);
      this.player.set(_newPlayer);
      this.webSocketService.sendMessage(`${BASE_OUTGOING_WS_TOPIC}/${gameId}`, {
        from: _newPlayer.id,
        action: WebSocketActions.PlayerAdded,
        data: _newPlayer,
      });
    }

    return _newPlayer;
  }

  clearOnlinePlayers() {
    this.onlinePlayers.set([]);
  }

  getOnlinePlayers(gameId: string) {
    this.apiService
      .getPlayersByGameId(gameId)
      .then((players) => this.onlinePlayers.set(players ?? []));
  }

  // Local Player CRUD
  createLocalPlayer(newPlayer: PlayerFormViewModel) {
    const _newPlayer = {
      ...newPlayer,
      id: ulid(),
      gameId: LOCAL_GAME_ID,
      isHost: false,
    };
    this.localPlayers.update((players) => [...players, _newPlayer]);
  }

  updateLocalPlayer(
    playerId: PlayerModel['id'],
    updatedPlayer: PlayerFormViewModel
  ) {
    this.localPlayers.update((players) =>
      players.map((player) =>
        player.id === playerId ? { ...player, ...updatedPlayer } : player
      )
    );
  }

  deleteLocalPlayer(playerId: PlayerModel['id']) {
    this.localPlayers.update((players) =>
      players.filter((player) => player.id !== playerId)
    );
  }

  reorderLocalPlayers(previousIndex: number, currentIndex: number) {
    const players = this.players();
    moveItemInArray(players, previousIndex, currentIndex);
    this.localPlayers.set(players);
  }

  handleMessage(message: WebSocketMessage) {
    if (message.action === WebSocketActions.PlayerAdded) {
      this.onlinePlayers.update((onlinePlayers) => [
        ...onlinePlayers,
        message.data as PlayerModel,
      ]);
    }
  }
}
