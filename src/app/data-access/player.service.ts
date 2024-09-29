import { Injectable, signal, WritableSignal } from '@angular/core';

type Player = {
  name: string;
  color: string;
};

export enum PlayerColors {
  Red = '#F34141',
  Orange = '#F38141',
  Yellow = '#F3CC41',
  Green = '#38D048',
  Blue = '#4188F3',
  Violet = '#B041F3',
  Pink = '#F659CA',
  Cyan = '#41D9FB',
  Brown = '#8E744D',
  White = '#D3D3D3',
  Gray = '#767676',
  Black = '#181818',
}

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  readonly players: WritableSignal<Player[]> = signal([
    { name: 'Player 1', color: PlayerColors.Red },
    { name: 'Player 2', color: PlayerColors.Blue },
    { name: 'Player 3', color: PlayerColors.Violet },
  ]);
}
