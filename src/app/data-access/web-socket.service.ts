import { Injectable, OnDestroy } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { MAX_SUBSCRIBE_RETRIES, WS_URL } from '../shared/constants';
import { Subject } from 'rxjs';
import { WebSocketMessage } from '../shared/types';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private readonly stompClient: Client;

  readonly subscriptions: StompSubscription[] = [];

  readonly messages$ = new Subject<WebSocketMessage>();

  constructor() {
    this.stompClient = new Client({
      brokerURL: WS_URL,
    });

    this.connect();
  }

  ngOnDestroy() {
    this.disconnect();
    this.unsubscribeAll();
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
  }

  sendMessage(destination: string, message: WebSocketMessage) {
    this.stompClient.publish({
      destination,
      body: JSON.stringify(message),
    });
  }
}
