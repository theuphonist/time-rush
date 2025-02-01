import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  Signal,
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

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private readonly apiService = inject(ApiService);
  private readonly gameService = inject(GameService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly game = this.gameService.game;

  private readonly localPlayers: WritableSignal<PlayerModel[]>;
  private readonly onlinePlayers: WritableSignal<PlayerModel[]>;
  readonly players = computed(() => {
    const selectedPlayers =
      this.game().id === LOCAL_GAME_ID
        ? this.localPlayers()
        : this.onlinePlayers();

    return selectedPlayers.sort(
      (player1, player2) => player1.position - player2.position
    );
  });

  readonly playerId: WritableSignal<PlayerModel['id'] | null>;

  readonly player: Signal<PlayerModel> = computed(
    () =>
      this.players().find((player) => player.id === this.playerId()) ?? {
        id: '',
        name: '',
        color: '',
        isHost: false,
        gameId: '',
        position: -1,
      }
  );

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

    this.playerId = signal(
      this.sessionStorageService.getItem(SessionStorageKeys.PlayerId) as
        | PlayerModel['id']
        | null
    );

    this.onlinePlayers = signal([]);

    const savedGame = this.game();

    this.getOnlinePlayers(savedGame.id);

    this.webSocketService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => this.handleMessage(message));
  }

  readonly updateSessionStorageOnLocalPlayerUpdatesEffect = effect(() => {
    this.sessionStorageService.setItem(
      SessionStorageKeys.Players,
      this.localPlayers()
    );
  });

  readonly updateSessionStorageOnPlayerIdUpdates = effect(() => {
    this.sessionStorageService.setItem(
      SessionStorageKeys.PlayerId,
      this.playerId()
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
      this.onlinePlayers().length,
      isHost
    );

    if (_newPlayer) {
      this.onlinePlayers.update((players) => [...players, _newPlayer]);
      this.playerId.set(_newPlayer.id);
      this.webSocketService.sendMessage(`${BASE_OUTGOING_WS_TOPIC}/${gameId}`, {
        action: WebSocketActions.UpdatePlayer,
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

  async updateOnlinePlayer(
    playerId: PlayerModel['id'],
    playerUpdates: Partial<PlayerModel>
  ) {
    const updatedPlayer = await this.apiService.updatePlayer({
      ...playerUpdates,
      id: playerId,
    });

    if (updatedPlayer) {
      this.onlinePlayers.update((players) =>
        players.map((player) =>
          player.id === updatedPlayer.id ? updatedPlayer : player
        )
      );

      this.webSocketService.sendMessage(
        `${BASE_OUTGOING_WS_TOPIC}/${this.game().id}`,
        {
          action: WebSocketActions.UpdatePlayer,
        }
      );
    }

    return updatedPlayer;
  }

  async deleteOnlinePlayer(
    playerId: PlayerModel['id'],
    gameId: GameModel['id']
  ) {
    const deletedPlayer = (await this.apiService.deletePlayer(
      playerId
    )) as PlayerModel | null;

    if (deletedPlayer) {
      this.onlinePlayers.update((players) =>
        players.filter((player) => player.id !== playerId)
      );
      this.webSocketService.sendMessage(`${BASE_OUTGOING_WS_TOPIC}/${gameId}`, {
        action: WebSocketActions.UpdatePlayer,
      });

      if (deletedPlayer.isHost) {
        this.webSocketService.sendMessage(
          `${BASE_OUTGOING_WS_TOPIC}/${gameId}`,
          {
            action: WebSocketActions.DeleteHost,
          }
        );
      }
    }
  }

  leaveOnlineGame() {
    const player = this.player();

    if (player) {
      this.deleteOnlinePlayer(player.id, this.game().id);
      this.playerId.set('_');
    }

    this.gameService.leaveOnlineGame();

    this.webSocketService.unsubscribeAll();
  }

  reorderOnlinePlayers(previousIndex: number, currentIndex: number) {
    const players = this.onlinePlayers();
    moveItemInArray(players, previousIndex, currentIndex);

    for (let i = 0; i < players.length; i++) {
      this.updateOnlinePlayer(players[i].id, { position: i });
    }

    this.webSocketService.sendMessage(
      `${BASE_OUTGOING_WS_TOPIC}/${this.game().id}`,
      { action: WebSocketActions.UpdatePlayer }
    );
  }

  // Local Player CRUD
  createLocalPlayer(newPlayer: PlayerFormViewModel) {
    const _newPlayer = {
      ...newPlayer,
      id: ulid(),
      gameId: LOCAL_GAME_ID,
      isHost: false,
      position: this.localPlayers().length - 1,
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

  // Misc
  async handleMessage(message: WebSocketMessage) {
    if (message.action === WebSocketActions.UpdatePlayer) {
      const players = await this.apiService.getPlayersByGameId(this.game().id);

      this.onlinePlayers.set(players ?? []);
    } else if (message.action === WebSocketActions.DeleteHost) {
      if (this.players().length) {
        // just in case current host hasn't been deleted yet
        const newHost = this.players().find((player) => !player.isHost);

        if (newHost) {
          await this.updateOnlinePlayer(newHost.id, {
            isHost: true,
          });
        }
      }
    }
  }
}
