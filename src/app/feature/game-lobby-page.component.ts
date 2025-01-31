import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { GameService } from '../data-access/game.service';
import { PlayerListComponent } from '../shared/player-list.component';
import { PlayerService } from '../data-access/player.service';
import { GameTypes } from '../shared/types';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'time-rush-game-lobby-page',
  standalone: true,
  imports: [HeaderComponent, PlayerListComponent, ButtonModule],
  template: `
    <time-rush-header
      [text]="game().name"
      alwaysSmall
      routeToPreviousPage="/home"
    />

    <div class="mt-page-content flex gap-6">
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
    </div>
    @if (players().length) {
    <time-rush-player-list
      class="block mt-3"
      [players]="players()"
      [player]="player()"
      [gameType]="GameTypes.Online"
    />

    <p-button
      class="w-full"
      styleClass="w-full mt-6"
      label="Let's go!"
      [disabled]="players().length < 2"
      (click)="onStartGameButtonClick()"
    />
    } @else {
    <p class="font-italic mt-4">
      No players found. Return to the home page and create a new game to get
      started.
    </p>
    }
  `,
})
export class GameLobbyPageComponent {
  private readonly gameService = inject(GameService);
  private readonly playerService = inject(PlayerService);
  private readonly router = inject(Router);

  readonly game = this.gameService.game;
  readonly players = this.playerService.players;
  readonly player = this.playerService.player;

  readonly console = console;

  readonly GameTypes = GameTypes;

  onStartGameButtonClick() {
    this.router.navigate(['/active-game']);
  }
}
