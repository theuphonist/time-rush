import { moveItemInArray } from '@angular/cdk/drag-drop';
import {
  DestroyRef,
  Injectable,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Observable } from 'rxjs';
import { ulid } from 'ulid';
import { Endpoints } from '../util/api-types';
import { LOCAL_CREATED_AT, LOCAL_GAME_ID } from '../util/constants';
import { Game } from '../util/game-types';
import { Player, PlayerForm } from '../util/player-types';
import { SessionStorageKeys } from '../util/session-storage-types';
import { OmitAutogeneratedProperties } from '../util/utility-types';
import { ApiService } from './api.service';
import { GameService } from './game.service';
import { SessionStorageService } from './session-storage.service';
import { WebSocketService } from './web-socket.service';

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

  private readonly localPlayers: WritableSignal<Player[]>;
  private readonly allOnlinePlayers: WritableSignal<Player[]>;
  private readonly connectedAndSortedOnlinePlayers = computed(() =>
    this.allOnlinePlayers(),
  );
  readonly players = computed(() => {
    const selectedPlayers =
      this.game().id === LOCAL_GAME_ID
        ? this.localPlayers()
        : this.connectedAndSortedOnlinePlayers();

    return selectedPlayers;
  });

  readonly playerId: WritableSignal<Player['id'] | null>;

  readonly player: Signal<Player> = computed(
    () =>
      this.players().find((player) => player.id === this.playerId()) ?? {
        id: '',
        name: '',
        color: '',
        gameId: LOCAL_GAME_ID,
        position: -1,
        createdAt: LOCAL_CREATED_AT,
        sessionId: null,
      },
  );

  readonly activePlayerId: WritableSignal<Player['id'] | undefined> =
    signal(undefined);

  readonly nextPlayer = computed(() => {
    const players = this.players();

    if (!players) {
      return;
    }

    const activePlayerIndex = players.findIndex(
      (player) => player.id === this.activePlayerId(),
    );

    if (activePlayerIndex === -1 || activePlayerIndex === players.length - 1) {
      return players[0];
    }

    return players[activePlayerIndex + 1];
  });

  constructor() {
    this.localPlayers = signal(
      (this.sessionStorageService.getItem(SessionStorageKeys.Players) ??
        []) as Player[],
    );
    this.playerId = signal(
      this.sessionStorageService.getItem(SessionStorageKeys.PlayerId) as
        | Player['id']
        | null,
    );
    this.allOnlinePlayers = signal([]);
    // const savedGame = this.game();
    // this.getOnlinePlayers(savedGame.id);
    // this.webSocketService.messages$
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe((message) => this.handleMessage(message));
  }

  readonly updateSessionStorageOnLocalPlayerUpdates = effect(() => {
    this.sessionStorageService.setItem(
      SessionStorageKeys.Players,
      this.localPlayers(),
    );
  });

  readonly updateSessionStorageOnPlayerIdUpdates = effect(() => {
    this.sessionStorageService.setItem(
      SessionStorageKeys.PlayerId,
      this.playerId(),
    );
  });

  // Online Player Methods
  createOnlinePlayer(
    player: OmitAutogeneratedProperties<Player>,
  ): Observable<Player> {
    return this.apiService.post<Player>(Endpoints.PLAYER, player);
  }

  getOnlinePlayerById(playerId: Player['id']): Observable<Player | null> {
    return this.apiService.get<Player | null>([Endpoints.PLAYER, playerId]);
  }

  getOnlinePlayersByGameId(gameId: Game['id']): Observable<Player[]> {
    return this.apiService.get<Player[]>(Endpoints.PLAYER, {
      gameId,
    });
  }

  updateOnlinePlayer(
    playerId: Player['id'],
    playerUpdates: Partial<Player>,
  ): Observable<Player | null> {
    return this.apiService.update<Player | null>(
      [Endpoints.PLAYER, playerId],
      playerUpdates,
    );
  }

  deleteOnlinePlayer(playerId: Player['id']): Observable<Player | null> {
    return this.apiService.delete<Player | null>([Endpoints.PLAYER, playerId]);
  }

  reorderOnlinePlayers(gameId: Game['id'], playerIds: Player['id'][]) {
    return this.apiService.update<Player[]>(
      [Endpoints.PLAYER, 'reorder', gameId],
      playerIds,
    );
  }

  clearOnlinePlayers() {
    this.allOnlinePlayers.set([]);
  }

  leaveOnlineGame() {
    const player = this.player();

    if (player) {
      this.deleteOnlinePlayer(player.id);
    }

    this.webSocketService.unsubscribeAll();
  }

  changeActiveOnlinePlayer(nextPlayerId?: Player['id']) {
    const activePlayerId = this.changeActivePlayer(nextPlayerId);
  }

  // Local Player Methods
  createLocalPlayer(newPlayer: PlayerForm) {
    const _newPlayer = {
      ...newPlayer,
      id: ulid(),
      gameId: LOCAL_GAME_ID,
      position: 1,
      createdAt: LOCAL_CREATED_AT,
      sessionId: null,
    };
    this.localPlayers.update((players) => [...players, _newPlayer]);
  }

  updateLocalPlayer(playerId: Player['id'], updatedPlayer: PlayerForm) {
    this.localPlayers.update((players) =>
      players.map((player) =>
        player.id === playerId ? { ...player, ...updatedPlayer } : player,
      ),
    );
  }

  deleteLocalPlayer(playerId: Player['id']) {
    this.localPlayers.update((players) =>
      players.filter((player) => player.id !== playerId),
    );
  }

  reorderLocalPlayers(previousIndex: number, currentIndex: number) {
    const players = this.players();
    moveItemInArray(players, previousIndex, currentIndex);
    this.localPlayers.set(players);
  }

  changeActiveLocalPlayer(nextPlayerId?: Player['id']) {
    this.changeActivePlayer(nextPlayerId);
  }

  private changeActivePlayer(nextPlayerId?: Player['id']) {
    const players = this.players();

    if (!players) {
      return;
    }

    if (this.activePlayerId() === undefined) {
      this.activePlayerId.set(players[0].id);
      return players[0].id;
    }

    if (nextPlayerId !== undefined) {
      this.activePlayerId.set(nextPlayerId);
      return nextPlayerId;
    }

    const currentPlayerIndex = players.findIndex(
      (player) => player.id === this.activePlayerId(),
    );

    const nextPlayerIndex =
      currentPlayerIndex + 1 >= players.length ? 0 : currentPlayerIndex + 1;

    this.activePlayerId.set(players[nextPlayerIndex].id);

    return players[nextPlayerIndex].id;
  }
}
