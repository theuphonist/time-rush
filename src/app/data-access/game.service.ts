import {
  Injectable,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Observable } from 'rxjs';
import { Endpoints } from '../util/api-types';
import {
  LOCAL_CREATED_AT,
  LOCAL_GAME_ID,
  LOCAL_JOIN_CODE,
} from '../util/constants';
import { Game, GameForm, GameStatuses, TimeUnits } from '../util/game-types';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly apiService = inject(ApiService);

  readonly game: WritableSignal<Game> = signal({
    id: LOCAL_GAME_ID,
    name: 'Time Rush',
    turnLength: 30,
    turnLengthUnits: TimeUnits.Seconds,
    joinCode: '_',
    status: GameStatuses.Pending,
    hostPlayerId: 'foo',
    createdAt: new Date(),
  });

  readonly isLocalGame = computed(() => this.game().id === LOCAL_GAME_ID);

  // Online Game CRUD
  createOnlineGame(gameForm: GameForm): Observable<Game> {
    return this.apiService.post<Game>(Endpoints.GAME, gameForm);
  }

  getGameById(gameId: Game['id']): Observable<Game | null> {
    return this.apiService.get<Game | null>([Endpoints.GAME, gameId]);
  }

  getGamesByJoinCode(joinCode: Game['joinCode']): Observable<Game[]> {
    return this.apiService.get<Game[]>(Endpoints.GAME, {
      joinCode,
    });
  }

  // Local Game CRUD
  createLocalGame(newGame: GameForm): Game {
    return {
      ...newGame,
      id: LOCAL_GAME_ID,
      joinCode: LOCAL_JOIN_CODE,
      status: GameStatuses.Local,
      hostPlayerId: null,
      createdAt: LOCAL_CREATED_AT,
    };
  }
}
