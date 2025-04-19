import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Endpoints } from '../util/api-types';
import {
  LOCAL_CREATED_AT,
  LOCAL_GAME_ID,
  LOCAL_JOIN_CODE,
} from '../util/constants';
import { Game, GameForm, GameStatuses } from '../util/game-types';
import { SessionStorageKeys } from '../util/session-storage-types';
import { ApiService } from './api.service';
import { SessionStorageService } from './session-storage.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly apiService = inject(ApiService);
  private readonly sessionStorageService = inject(SessionStorageService);

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
  createLocalGame(gameForm: GameForm): Game {
    const newGame: Game = {
      ...gameForm,
      id: LOCAL_GAME_ID,
      joinCode: LOCAL_JOIN_CODE,
      status: GameStatuses.Local,
      hostPlayerId: null,
      createdAt: LOCAL_CREATED_AT,
    };

    this.sessionStorageService.setItem(SessionStorageKeys.Game, newGame);

    return newGame;
  }
}
