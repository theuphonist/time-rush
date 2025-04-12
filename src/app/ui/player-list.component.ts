import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Player } from '../util/player-types';
import { PlayerNameWithIconComponent } from './player-name-with-icon.component';

@Component({
  selector: 'time-rush-player-list',
  standalone: true,
  imports: [PlayerNameWithIconComponent, RouterLink, DragDropModule],
  template: `
    <!-- Players -->
    <div
      cdkDropList
      (cdkDropListDropped)="onPlayerDrop($event)"
      [cdkDropListDisabled]="!reorderable()"
    >
      @for (_player of players(); track _player.id) {
        <div
          style="border-bottom: 1px solid"
          class="flex align-items-center justify-content-between border-200 py-2"
          cdkDrag
          cdkDragPreviewContainer="parent"
        >
          <div class="flex align-items-center">
            @if (reorderable()) {
              <div class="pi pi-bars px-3 py-2 text-400" cdkDragHandle></div>
            }

            <time-rush-player-name-with-icon
              [player]="_player"
              [isHost]="_player.id === hostPlayerId()"
            />
          </div>

          @if (editablePlayerIdSet().has(_player.id)) {
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
  `,
})
export class PlayerListComponent {
  readonly players = input.required<Player[]>();
  readonly editablePlayerIds = input.required<Player['id'][]>();
  readonly hostPlayerId = input<Player['id']>();
  readonly reorderable = input<boolean>();

  readonly editablePlayerIdSet = computed(
    () => new Set(this.editablePlayerIds()),
  );

  readonly playerOrderChange = output<CdkDragDrop<string[]>>();

  onPlayerDrop(event: CdkDragDrop<string[]>): void {
    this.playerOrderChange.emit(event);
  }
}
