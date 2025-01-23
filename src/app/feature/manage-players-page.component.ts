import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { PlayerNameWithIconComponent } from '../shared/player-name-with-icon.component';
import { PlayerService } from '../data-access/player.service';
import { Router, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'time-rush-manage-players-page',
  standalone: true,
  imports: [
    HeaderComponent,
    PlayerNameWithIconComponent,
    RouterLink,
    DragDropModule,
    ButtonModule,
  ],
  template: `
    <time-rush-header
      text="Manage Players"
      alwaysSmall
      routeToPreviousPage="/new-game"
    />

    <!-- Players -->
    <div class="mt-page-content">
      <div cdkDropList (cdkDropListDropped)="onPlayerDrop($event)">
        @for (player of players(); track player.id) {
        <div
          style="border-bottom: 1px solid"
          class="flex align-items-center justify-content-between border-200 h-4rem"
          cdkDrag
          cdkDragPreviewContainer="parent"
        >
          <div class="flex align-items-center">
            <div class="pi pi-bars px-3 py-2 text-400" cdkDragHandle></div>
            <time-rush-player-name-with-icon
              [playerColor]="player.color"
              [playerName]="player.name"
            />
          </div>
          <a
            class="text-primary px-2 py-2"
            [routerLink]="'/edit-player/' + [player.id]"
          >
            <i class="pi pi-pencil"></i>
          </a>
          <div class="surface-200 h-4rem w-full" *cdkDragPlaceholder></div>
          <div class="flex align-items-center surface-0 w-full" *cdkDragPreview>
            <div class="pi pi-bars px-3 py-2 text-400" cdkDragHandle></div>
            <time-rush-player-name-with-icon
              [playerColor]="player.color"
              [playerName]="player.name"
            />
          </div>
        </div>
        }
      </div>
      <a
        routerLink="/new-player"
        class="block flex align-items-center justify-content-center w-full mt-2 h-3rem mb-2 surface-200 border-transparent border-round text-500 no-underline"
        ><i class="pi pi-plus"></i
      ></a>
      <small
        ><span class="text-500"
          >Drag and drop players to set turn order.</span
        ></small
      >
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
export class ManagePlayersPageComponent {
  private readonly playerService = inject(PlayerService);
  private readonly router = inject(Router);

  readonly players = this.playerService.players;

  onPlayerDrop(ev: CdkDragDrop<string[]>): void {
    this.playerService.reorderPlayers(ev.previousIndex, ev.currentIndex);
  }

  onStartGameButtonClick() {
    this.router.navigate(['/active-game']);
  }
}
