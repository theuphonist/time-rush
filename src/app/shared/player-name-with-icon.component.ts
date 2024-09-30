import { Component, input } from '@angular/core';
import { PlayerIconComponent } from './player-icon.component';

@Component({
  selector: 'turnt-player-name-with-icon',
  standalone: true,
  imports: [PlayerIconComponent],
  template: ` <div class="flex align-items-center py-2">
    <turnt-player-icon [playerColor]="playerColor()" class="mr-2" />
    <div class="text-600">{{ playerName() }}</div>
  </div>`,
})
export class PlayerNameWithIconComponent {
  playerColor = input.required<string>();
  playerName = input.required<string>();
}
