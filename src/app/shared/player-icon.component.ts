import { Component, input } from '@angular/core';

@Component({
  selector: 'time-rush-player-icon',
  standalone: true,
  imports: [],
  template: `
    <div
      class="border-circle border-400 border-3 h-3rem w-3rem"
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
