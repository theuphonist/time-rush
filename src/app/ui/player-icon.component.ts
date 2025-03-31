import { Component, input } from '@angular/core';

@Component({
  selector: 'time-rush-player-icon',
  standalone: true,
  imports: [],
  template: `
    <div
      class="relative border-circle border-400 border-3 h-3rem w-3rem"
      [style]="{ backgroundColor: playerColor() }"
    >
      @if(isHost()) {
      <p
        class="text-xl m-0 absolute text-center left-0 right-0 w-auto"
        [style.top]="'-1rem'"
      >
        👑
      </p>
      }
    </div>
  `,
  styles: ``,
})
export class PlayerIconComponent {
  readonly playerColor = input.required<string>();
  readonly isHost = input<boolean>(false);
}
