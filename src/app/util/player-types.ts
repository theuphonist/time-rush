import { Game } from './game-types';

export interface Player {
  id: string;
  name: string;
  color: string;
  gameId: Game['id'];
  position: number;
  isConnected: boolean;
  createdAt: Date;
}

export interface PlayerForm {
  name: string;
  color: string;
}
