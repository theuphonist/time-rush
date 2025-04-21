import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Endpoints } from '../util/api-types';
import {
  LOCAL_CREATED_AT,
  LOCAL_GAME_ID,
  LOCAL_JOIN_CODE,
} from '../util/constants';
import { Game, GameForm, GameStatuses, TimeUnits } from '../util/game-types';
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
    return this.apiService.post<Game>(Endpoints.GAME, {
      ...gameForm,
      turnLength: toMilliseconds(gameForm.turnLength, gameForm.turnLengthUnits),
    });
  }

  getGameById(gameId: Game['id']): Observable<Game | null> {
    return this.apiService.get<Game | null>([Endpoints.GAME, gameId]);
  }

  getGamesByJoinCode(joinCode: Game['joinCode']): Observable<Game[]> {
    return this.apiService.get<Game[]>(Endpoints.GAME, {
      joinCode,
    });
  }

  updateOnlineGame(
    gameId: Game['id'],
    gameUpdates: Partial<Game>,
  ): Observable<Game | null> {
    return this.apiService.update<Game | null>(
      [Endpoints.GAME, gameId],
      gameUpdates,
    );
  }

  // Local Game CRUD
  createLocalGame(gameForm: GameForm): Game {
    const turnLengthInMs = toMilliseconds(
      gameForm.turnLength,
      gameForm.turnLengthUnits,
    );

    const newGame: Game = {
      id: LOCAL_GAME_ID,
      name: gameForm.name,
      turnLength: turnLengthInMs,
      joinCode: LOCAL_JOIN_CODE,
      status: GameStatuses.Local,
      hostPlayerId: null,
      activePlayerId: null,
      createdAt: LOCAL_CREATED_AT,
    };

    this.sessionStorageService.setItem(SessionStorageKeys.Game, newGame);

    return newGame;
  }

  updateLocalGame(gameUpdates: Partial<Game>) {
    const localGame = this.sessionStorageService.getItem(
      SessionStorageKeys.Game,
    ) as Game | null;

    if (!localGame) {
      return null;
    }

    const updatedLocalGame = { ...localGame, ...gameUpdates };

    this.sessionStorageService.setItem(
      SessionStorageKeys.Game,
      updatedLocalGame,
    );

    return updatedLocalGame;
  }
}

function toMilliseconds(timeValue: number, units: TimeUnits): number {
  if (units === TimeUnits.Minutes) {
    return timeValue * 60 * 1000;
  }

  if (units === TimeUnits.Seconds) {
    return timeValue * 1000;
  }

  return timeValue;
}
