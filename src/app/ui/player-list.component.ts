import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Player } from '../util/player-types';
import { PlayerNameWithIconComponent } from './player-name-with-icon.component';

@Component({
  selector: 'time-rush-player-list',
  standalone: true,
  imports: [
    PlayerNameWithIconComponent,
    RouterLink,
    DragDropModule,
    ButtonModule,
  ],
  template: `
    <!-- Players -->
    <div
      cdkDropList
      (cdkDropListDropped)="onPlayerDrop($event)"
      [cdkDropListDisabled]="!listIsReorderable()"
    >
      @for (_player of players(); track _player.id) {
      <div
        style="border-bottom: 1px solid"
        class="flex align-items-center justify-content-between border-200 py-2"
        cdkDrag
        cdkDragPreviewContainer="parent"
      >
        <div class="flex align-items-center">
          @if (listIsReorderable()) {
          <div class="pi pi-bars px-3 py-2 text-400" cdkDragHandle></div>
          }

          <time-rush-player-name-with-icon
            [player]="_player"
            [isHost]="_player.id === hostPlayerId()"
          />
        </div>

        @if (player().id === _player.id || isLocalGame()) {
        <a
          class="text-primary px-2 py-2"
          [routerLink]="'/edit-player/' + [_player.id]"
        >
          <i class="pi pi-pencil"></i>
        </a>
        }

        <!-- Drag Placeholder -->
        <div class="surface-200 h-4rem w-full" *cdkDragPlaceholder></div>

        <!-- Drag Preview -->
        <div
          class="flex align-items-center surface-0 w-full py-2"
          *cdkDragPreview
        >
          <div class="pi pi-bars px-3 py-2 text-400" cdkDragHandle></div>

          <time-rush-player-name-with-icon
            [player]="_player"
            [isHost]="_player.id === hostPlayerId()"
          />
        </div>
      </div>
      }
    </div>
    @if(isLocalGame()){
    <a
      routerLink="/new-player"
      class="block flex align-items-center justify-content-center w-full mt-2 h-3rem surface-200 border-transparent border-round text-500 no-underline"
      ><i class="pi pi-plus"></i
    ></a>
    } @if (listIsReorderable() && players().length) {
    <p class="text-500 mt-2">
      <small>Drag and drop players to set turn order.</small>
    </p>
    }
  `,
})
export class PlayerListComponent {
  readonly players = input.required<Player[]>();
  readonly player = input.required<Player>();
  readonly isLocalGame = input.required<boolean>();
  readonly hostPlayerId = input.required<Player['id'] | undefined>();

  readonly listIsReorderable = computed(
    () => this.isLocalGame() || this.hostPlayerId() === this.player().id
  );

  readonly playerOrderChange = output<CdkDragDrop<string[]>>();

  onPlayerDrop(event: CdkDragDrop<string[]>): void {
    this.playerOrderChange.emit(event);
  }
}
