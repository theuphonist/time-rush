import { Component, computed, input, output } from '@angular/core';
import { PlayerNameWithIconComponent } from '../shared/player-name-with-icon.component';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { GameTypes, PlayerModel } from './types';

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

          <time-rush-player-name-with-icon [player]="_player" />
        </div>

        @if(player().id === _player.id || gameType() === GameTypes.Local) {
        <a
          class="text-primary px-2 py-2"
          [routerLink]="'/edit-player/' + [_player.id] + '/' + gameType()"
        >
          <i class="pi pi-pencil"></i>
        </a>
        }

        <!-- Drag Placeholder -->
        <div class="surface-200 h-4rem w-full" *cdkDragPlaceholder></div>

        <!-- Drag Preview -->
        <div class="flex align-items-center surface-0 w-full" *cdkDragPreview>
          <div class="pi pi-bars px-3 py-2 text-400" cdkDragHandle></div>
          <time-rush-player-name-with-icon [player]="_player" />
        </div>
      </div>
      }
    </div>
    @if(gameType() === GameTypes.Local){
    <a
      [routerLink]="'/new-player/' + GameTypes.Local"
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
  readonly players = input.required<PlayerModel[]>();
  readonly player = input.required<PlayerModel>();
  readonly gameType = input.required<GameTypes>();

  readonly listIsReorderable = computed(
    () => this.player().isHost || this.gameType() === GameTypes.Local
  );

  readonly playerOrderChange = output<CdkDragDrop<string[]>>();

  onPlayerDrop(event: CdkDragDrop<string[]>): void {
    this.playerOrderChange.emit(event);
  }

  readonly GameTypes = GameTypes;
}
