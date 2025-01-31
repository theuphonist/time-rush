import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { PlayerService } from '../data-access/player.service';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { GameTypes } from '../shared/types';
import { PlayerListComponent } from '../shared/player-list.component';

@Component({
  selector: 'time-rush-manage-local-players-page',
  standalone: true,
  imports: [HeaderComponent, DragDropModule, ButtonModule, PlayerListComponent],
  template: `
    <time-rush-header
      text="Manage Players"
      alwaysSmall
      routeToPreviousPage="/new-game"
    />

    <!-- Players -->
    <div class="mt-page-content">
      @if (players().length) {
      <time-rush-player-list
        class="block mt-3"
        [players]="players()"
        [player]="player()"
        [gameType]="GameTypes.Online"
      />
      } @else {
      <p class="font-italic mt-4">
        No players found. Return to the home page and create a new game to get
        started.
      </p>
      }
      <p-button
        class="w-full"
        styleClass="w-full mt-6"
        label="Let's go!"
        [disabled]="players().length < 2"
        (click)="onStartGameButtonClick()"
      />
    </div>
  `,
  styles: ``,
})
export class ManageLocalPlayersPageComponent {
  private readonly playerService = inject(PlayerService);
  private readonly router = inject(Router);

  readonly players = this.playerService.players;
  readonly player = this.playerService.player;

  onPlayerDrop(ev: CdkDragDrop<string[]>): void {
    this.playerService.reorderLocalPlayers(ev.previousIndex, ev.currentIndex);
  }

  onStartGameButtonClick() {
    this.router.navigate(['/active-game']);
  }

  readonly GameTypes = GameTypes;
}
