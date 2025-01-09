import { Injectable, OnDestroy } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { WS_URL } from '../shared/constants';

interface WebSocketMessage {
  content: string;
  from: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private readonly stompClient: Client = new Client({
    brokerURL: WS_URL,
  });

  private readonly subscriptions: StompSubscription[] = [];

  ngOnDestroy() {
    this.disconnect();

    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  connect(): void {
    this.stompClient.activate();
  }

  disconnect(): void {
    this.stompClient.deactivate();
  }

  sendMessage(destination: string, message: WebSocketMessage) {
    this.stompClient.publish({
      destination,
      body: JSON.stringify(message),
    });
  }
}
