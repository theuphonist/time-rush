import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { StateService } from '../data-access/state.service';
import { HeaderComponent } from '../ui/header.component';
import { PlayerListComponent } from '../ui/player-list.component';
import { GameTypes } from '../util/game-types';
import { Player } from '../util/player-types';

@Component({
  selector: 'time-rush-manage-local-players-page',
  standalone: true,
  imports: [
    HeaderComponent,
    DragDropModule,
    ButtonModule,
    PlayerListComponent,
    RouterLink,
  ],
  template: `
    <time-rush-header
      text="Manage Players"
      alwaysSmall
      (backButtonClick)="onBackButtonClick()"
    />

    <!-- Players -->
    <main class="mt-page-content">
      <time-rush-player-list
        class="block mt-3"
        [players]="players()"
        [editablePlayerIds]="allPlayerIds()"
        [deletablePlayerIds]="allPlayerIds()"
        [reorderable]="true"
        (playerOrderChange)="onPlayerOrderChange($event)"
        (deletePlayerButtonClick)="onDeletePlayerButtonClick($event.player)"
      />
      <a
        routerLink="/new-player"
        class="block flex align-items-center justify-content-center w-full mt-2 h-3rem surface-200 border-transparent border-round text-500 no-underline"
        ><i class="pi pi-plus"></i
      ></a>

      <p-button
        class="w-full"
        styleClass="w-full mt-6"
        label="Let's go!"
        [disabled]="startButtonDisabled()"
        (click)="onStartGameButtonClick()"
      />
    </main>
  `,
  styles: ``,
})
export class ManageLocalPlayersPageComponent {
  private readonly state = inject(StateService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  readonly players = this.state.selectConnectedAndSortedPlayers;
  readonly player = this.state.selectPlayer;
  readonly hostPlayerId = this.state.selectHostPlayerId;
  readonly allPlayerIds = this.state.selectPlayerIds;

  readonly startButtonDisabled = computed(
    () => (this.players()?.length ?? 0) < 2,
  );

  onPlayerOrderChange(event: CdkDragDrop<string[]>): void {
    const playerIds = this.players().map((player) => player.id);

    moveItemInArray(playerIds, event.previousIndex, event.currentIndex);

    this.state.dispatch(this.state.actions.playersReordered, { playerIds });
  }

  onStartGameButtonClick() {
    this.router.navigate(['/active-game']);
  }

  onBackButtonClick() {
    this.state.dispatch(
      this.state.actions.leaveLocalGameButtonClicked,
      undefined,
    );
  }

  onDeletePlayerButtonClick(player: Player) {
    this.confirmationService.confirm({
      message: `Delete ${player.name}?  This cannot be undone.`,
      header: 'Delete Player',
      accept: () => {
        this.state.dispatch(this.state.actions.deletePlayerConfirmed, {
          playerId: player.id,
        });
      },
      acceptButtonStyleClass: 'bg-red-400 border-none w-4rem ml-2',
      rejectButtonStyleClass: 'p-button-text w-4rem',
      acceptIcon: 'none',
      rejectIcon: 'none',
    });
  }

  readonly GameTypes = GameTypes;
}
