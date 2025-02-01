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
import { catchError, firstValueFrom, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly httpClient = inject(HttpClient);

  // Game CRUD
  async createGame(game: GameFormViewModel): Promise<GameModel | undefined> {
    const response = await firstValueFrom(
      this.httpClient
        .post(`${API_URL}/${Endpoints.GAME}`, JSON.stringify(game), {
          headers: COMMON_HEADERS,
        })
        .pipe(catchError(() => of(undefined)))
    );

    return response as GameModel | undefined;
  }

  async getGameByJoinCode(
    joinCode: GameModel['joinCode']
  ): Promise<GameModel | undefined> {
    const response = await firstValueFrom(
      this.httpClient
        .get(`${API_URL}/${Endpoints.GAME}?joinCode=${joinCode}`)
        .pipe(catchError(() => of(undefined)))
    );

    return response as GameModel | undefined;
  }

  // Player CRUD
  async createPlayer(
    player: PlayerFormViewModel,
    gameId: GameModel['id'],
    position: number,
    isHost: boolean = false
  ) {
    const _player = {
      ...player,
      gameId,
      isHost,
      position,
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

  async getPlayersByGameId(gameId: GameModel['id']) {
    const response = await firstValueFrom(
      this.httpClient
        .get(`${API_URL}/${Endpoints.PLAYER}?gameId=${gameId}`, {
          headers: COMMON_HEADERS,
        })
        .pipe(catchError(() => of(undefined)))
    );

    return response as PlayerModel[] | undefined;
  }

  async updatePlayer(playerUpdates: Partial<PlayerModel>) {
    const response = await firstValueFrom(
      this.httpClient
        .put(`${API_URL}/${Endpoints.PLAYER}`, JSON.stringify(playerUpdates), {
          headers: COMMON_HEADERS,
        })
        .pipe(catchError(() => of(undefined)))
    );

    return response as PlayerModel | undefined;
  }

  async deletePlayer(playerId: PlayerModel['id']) {
    const response = await firstValueFrom(
      this.httpClient
        .delete(`${API_URL}/${Endpoints.PLAYER}?playerId=${playerId}`, {
          headers: COMMON_HEADERS,
        })
        .pipe(catchError(() => of(undefined)))
    );

    return response as unknown;
  }
}
