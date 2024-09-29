import { Component, input } from '@angular/core';

@Component({
  selector: 'turnt-player-name-with-icon',
  standalone: true,
  imports: [],
  template: ` <div class="flex align-items-center py-2">
    <div
      class="border-circle border-400 border-3 h-3rem w-3rem mr-2"
      [style]="'background-color: ' + playerColor()"
    ></div>
    <div class="text-600">{{ playerName() }}</div>
  </div>`,
})
export class PlayerNameWithIconComponent {
  playerColor = input.required<string>();
  playerName = input.required<string>();
}
