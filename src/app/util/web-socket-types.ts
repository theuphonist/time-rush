export type WebSocketMessage =
  // actions that do NOT have associated data
  {
    action?:
      | WebSocketActions.GameStarted
      | WebSocketActions.PlayersOrGameUpdated;
    data?: unknown;
  };

export enum WebSocketActions {
  // incoming (from server)
  PlayersOrGameUpdated = 'playersOrGameUpdated',
  GameStarted = 'gameStarted',
}

export enum WebSocketTopics {
  Connect = 'connect',
}
