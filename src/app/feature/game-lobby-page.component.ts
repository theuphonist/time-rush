import { Component } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';

@Component({
  selector: 'time-rush-game-lobby-page',
  standalone: true,
  imports: [HeaderComponent],
  template: `
    <time-rush-header
      [text]="'Lobby'"
      alwaysSmall
      routeToPreviousPage="/home"
    />
    <section class="mt-page-content flex gap-3">
      <div class="flex flex-column align-items-start">Lobby</div>
    </section>
  `,
})
export class GameLobbyPageComponent {}
