import { Component, computed, input } from '@angular/core';
import { getContrastingColorClass } from './helpers';

@Component({
  selector: 'time-rush-player-icon',
  standalone: true,
  imports: [],
  template: `
    <div
      class="border-circle border-400 border-3 h-3rem w-3rem inline-block"
      [class.opacity-20]="disabled()"
      [style]="{ backgroundColor: playerColor() }"
    ></div>
  `,
  styles: ``,
})
export class PlayerIconComponent {
  readonly playerColor = input.required<string>();
  readonly disabled = input<boolean>();
}
