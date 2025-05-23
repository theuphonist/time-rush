import { Component, input } from '@angular/core';
import { Player } from '../util/player-types';
import { PlayerIconComponent } from './player-icon.component';

@Component({
  selector: 'time-rush-player-name-with-icon',
  standalone: true,
  imports: [PlayerIconComponent],
  template: ` <div class="flex align-items-center gap-3">
    <time-rush-player-icon [playerColor]="player().color" [isHost]="isHost()" />
    <div class="text-600">
      {{ player().name + (isHost() ? ' (Host)' : '') }}
    </div>
  </div>`,
})
export class PlayerNameWithIconComponent {
  readonly player = input.required<Player>();
  readonly isHost = input.required<boolean>();
}
