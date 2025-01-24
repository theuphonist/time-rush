import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { GameService } from '../data-access/game.service';

@Component({
  selector: 'time-rush-game-lobby-page',
  standalone: true,
  imports: [HeaderComponent],
  template: `
    <time-rush-header
      [text]="game().name"
      alwaysSmall
      routeToPreviousPage="/home"
    />
    <section class="mt-page-content flex gap-6">
      <div class="flex flex-column">
        <h2 class="text-600 text-lg font-semibold mt-0 mb-1">Join Code</h2>
        <p class="text-3xl font-bold m-0">{{ game().joinCode }}</p>
      </div>
      <div class="flex flex-column">
        <h2 class="text-600 text-lg font-semibold mt-0 mb-1">Turn Length</h2>
        <p class="text-3xl font-bold m-0">
          {{ game().turnLength }} {{ game().turnLengthUnits }}
        </p>
      </div>
    </section>
  `,
})
export class GameLobbyPageComponent {
  private readonly gameService = inject(GameService);

  readonly game = this.gameService.game;
}
