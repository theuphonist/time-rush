import { Component, input } from '@angular/core';

@Component({
  selector: 'time-rush-player-icon',
  standalone: true,
  imports: [],
  template: `
    <div
      class="border-circle border-400 border-3 h-3rem w-3rem inline-block"
      [class.opacity-20]="disabled()"
      [style]="'background-color: ' + playerColor()"
    ></div>
  `,
  styles: ``,
})
export class PlayerIconComponent {
  playerColor = input.required<string>();
  disabled = input<boolean>();
}
