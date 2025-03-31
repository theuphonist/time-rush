import { Injectable, OnDestroy, inject } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import {
  Subject,
  TimeoutError,
  catchError,
  filter,
  firstValueFrom,
  of,
  timeout,
} from 'rxjs';
import {
  BASE_INCOMING_WS_TOPIC,
  BASE_OUTGOING_WS_TOPIC,
  CONNECTION_TIMEOUT,
  LOCAL_PLAYER_ID,
  MAX_SEND_RETRIES,
  WS_URL,
} from '../util/constants';
import { Game } from '../util/game-types';
import { Player } from '../util/player-types';
import { SessionStorageKeys } from '../util/session-storage-types';
import { WebSocketMessage, WebSocketTopics } from '../util/web-socket-types';
import { SessionStorageService } from './session-storage.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly stompClient: Client;

  private subscriptions: StompSubscription[] = [];

  readonly messages$ = new Subject<WebSocketMessage>();
  private readonly connectionWatcher$ = new Subject<boolean>();

  constructor() {
    this.stompClient = new Client({
      brokerURL: WS_URL,
      onConnect: () => this.connectionWatcher$.next(true),
      onDisconnect: () => this.connectionWatcher$.next(false),
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll();
    this.disconnect();
  }

  async connect(): Promise<boolean> {
    this.stompClient.activate();

    setTimeout(() => {
      if (!this.stompClient.connected) {
        this.stompClient.deactivate();
      }
    }, CONNECTION_TIMEOUT);

    return firstValueFrom(
      this.connectionWatcher$.pipe(
        filter((isConnected) => isConnected),
        timeout(CONNECTION_TIMEOUT),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            return of(false);
          }

          throw err;
        })
      )
    );
  }

  private disconnect(): void {
    this.stompClient.deactivate();
  }

  subscribe(topic: string) {
    this.subscriptions.push(
      this.stompClient.subscribe(topic, (message) => {
        this.messages$.next(JSON.parse(message.body) as WebSocketMessage);
      })
    );
  }

  unsubscribeAll() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }

    this.subscriptions = [];
  }

  sendMessage(
    destination: string,
    message: WebSocketMessage,
    retryNumber?: number
  ) {
    if (!this.stompClient.connected && (retryNumber ?? 0) <= MAX_SEND_RETRIES) {
      setTimeout(
        () => this.sendMessage(destination, message, (retryNumber ?? 0) + 1),
        1000
      );
      return;
    }
    this.stompClient.publish({
      destination,
      body: JSON.stringify(message),
    });
  }

  private onConnect() {
    const playerId = this.sessionStorageService.getItem(
      SessionStorageKeys.PlayerId
    ) as Player['id'] | undefined;

    if (playerId && playerId !== LOCAL_PLAYER_ID) {
      this.sendMessage(
        `${BASE_OUTGOING_WS_TOPIC}/${WebSocketTopics.MapSession}`,
        {
          data: {
            playerId,
          },
        }
      );
    }

    const game = this.sessionStorageService.getItem(SessionStorageKeys.Game) as
      | Game
      | undefined;

    if (game?.id) {
      this.subscribe(
        `${BASE_INCOMING_WS_TOPIC}/${WebSocketTopics.Game}/${game.id}`
      );
    }
  }
}
