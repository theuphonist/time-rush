import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { GameModel } from './game.service';
import { Endpoints, API_URL, COMMON_HEADERS } from '../shared/constants';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly httpClient = inject(HttpClient);

  createGame(game: GameModel): void {
    this.httpClient
      .post(`${API_URL}/${Endpoints.GAME}`, JSON.stringify(game), {
        headers: COMMON_HEADERS,
      })
      .subscribe(); // subscribe needs to be present to send request
  }
}
