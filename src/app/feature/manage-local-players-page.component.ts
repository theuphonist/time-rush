import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PlayerService } from '../data-access/player.service';
import { HeaderComponent } from '../ui/header.component';
import { PlayerListComponent } from '../ui/player-list.component';
import { GameTypes } from '../util/game-types';

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
      <time-rush-player-list
        class="block mt-3"
        [players]="players()"
        [player]="player()"
        [isLocalGame]="true"
        (playerOrderChange)="onPlayerOrderChange($event)"
      />

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

  onPlayerOrderChange(event: CdkDragDrop<string[]>): void {
    this.playerService.reorderLocalPlayers(
      event.previousIndex,
      event.currentIndex
    );
  }

  onStartGameButtonClick() {
    this.router.navigate(['/active-game']);
  }

  readonly GameTypes = GameTypes;
}
