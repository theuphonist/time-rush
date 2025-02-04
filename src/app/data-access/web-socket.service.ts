import { inject, Injectable, OnDestroy } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import {
  BASE_INCOMING_WS_TOPIC,
  BASE_OUTGOING_WS_TOPIC,
  LOCAL_PLAYER_ID,
  MAX_SEND_RETRIES,
  MAX_SUBSCRIBE_RETRIES,
  WS_URL,
} from '../shared/constants';
import { Subject } from 'rxjs';
import {
  GameModel,
  PlayerModel,
  SessionStorageKeys,
  WebSocketMessage,
  WebSocketTopics,
} from '../shared/types';
import { SessionStorageService } from './session-storage.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly stompClient: Client;

  private subscriptions: StompSubscription[] = [];

  readonly messages$ = new Subject<WebSocketMessage>();

  constructor() {
    this.stompClient = new Client({
      brokerURL: WS_URL,
      onConnect: this.onConnect,
    });

    this.connect();
  }

  ngOnDestroy() {
    this.unsubscribeAll();
    this.disconnect();
  }

  private connect(): void {
    this.stompClient.activate();
  }

  private disconnect(): void {
    this.stompClient.deactivate();
  }

  subscribe(topic: string, retryNumber?: number) {
    if (
      !this.stompClient.connected &&
      (retryNumber ?? 0) <= MAX_SUBSCRIBE_RETRIES
    ) {
      setTimeout(() => this.subscribe(topic, (retryNumber ?? 0) + 1), 1000);
      return;
    }
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
    ) as PlayerModel['id'] | undefined;

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
      | GameModel
      | undefined;

    if (game?.id) {
      this.subscribe(
        `${BASE_INCOMING_WS_TOPIC}/${WebSocketTopics.Game}/${game.id}`
      );
    }
  }
}
