import { Injectable, OnDestroy } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import {
  Subject,
  TimeoutError,
  catchError,
  filter,
  firstValueFrom,
  of,
  tap,
  timeout,
} from 'rxjs';
import {
  BASE_INCOMING_WS_TOPIC,
  BASE_OUTGOING_WS_TOPIC,
  CONNECTION_TIMEOUT,
  WS_URL,
} from '../util/constants';
import { Game } from '../util/game-types';
import { Player } from '../util/player-types';
import { WebSocketMessage, WebSocketTopics } from '../util/web-socket-types';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
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
    this.disconnect();
  }

  async connect(playerId: Player['id'], gameId: Game['id']): Promise<boolean> {
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
        tap(() => {
          this.subscribe(gameId);
          this.sendMessage(WebSocketTopics.Connect, { data: { playerId } });
        }),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            return of(false);
          }

          throw err;
        }),
      ),
    );
  }

  disconnect(): void {
    this.unsubscribeAll();
    this.stompClient.deactivate();
  }

  private subscribe(topic: string) {
    this.subscriptions.push(
      this.stompClient.subscribe(
        `${BASE_INCOMING_WS_TOPIC}/${topic}`,
        (message) => {
          this.messages$.next(JSON.parse(message.body) as WebSocketMessage);
        },
      ),
    );
  }

  unsubscribeAll() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }

    this.subscriptions = [];
  }

  sendMessage(destination: string, message: WebSocketMessage): boolean {
    if (!this.stompClient.connected) {
      return false;
    }

    this.stompClient.publish({
      destination: `${BASE_OUTGOING_WS_TOPIC}/${destination}`,
      body: JSON.stringify(message),
    });

    return true;
  }
}
