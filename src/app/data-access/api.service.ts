import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL, COMMON_HEADERS } from '../shared/constants';
import {
  GameModel,
  PlayerModel,
  Endpoints,
  GameFormViewModel,
  PlayerFormViewModel,
} from '../shared/types';
import { catchError, firstValueFrom, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly httpClient = inject(HttpClient);

  // Game CRUD
  async createGame(game: GameFormViewModel) {
    const response = await firstValueFrom(
      this.httpClient
        .post(`${API_URL}/${Endpoints.GAME}`, JSON.stringify(game), {
          headers: COMMON_HEADERS,
        })
        .pipe(catchError(() => of(undefined)))
    );

    return response as GameModel | undefined;
  }

  readGame(joinCode: GameModel['joinCode']): Observable<Object> {
    return this.httpClient.get(`${API_URL}/${Endpoints.GAME}/${joinCode}`);
  }

  // Player CRUD
  async createPlayer(
    player: PlayerFormViewModel,
    gameId: GameModel['id'],
    isHost: boolean = false
  ) {
    const _player = {
      ...player,
      gameId,
      isHost,
    };
    const response = await firstValueFrom(
      this.httpClient
        .post(`${API_URL}/${Endpoints.PLAYER}`, JSON.stringify(_player), {
          headers: COMMON_HEADERS,
        })
        .pipe(catchError(() => of(undefined)))
    );

    return response as PlayerModel | undefined;
  }
}
