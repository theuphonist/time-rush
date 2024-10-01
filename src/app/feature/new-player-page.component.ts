import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../shared/header.component';
import { PlayerColors } from '../data-access/player.service';
import { PlayerIconComponent } from '../shared/player-icon.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'turnt-new-player-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FormsModule,
    InputTextModule,
    PlayerIconComponent,
    ButtonModule,
  ],
  template: `<turnt-header
      text="New Player"
      alwaysSmall
      routeToPreviousPage="new-game"
    />
    <!-- Game name input -->
    <div class="mt-page-content">
      <label for="player-name"
        ><span class="text-600 text-lg font-semibold">Player Name</span></label
      >
      <input
        class="w-full mt-2 mb-1"
        id="player-name"
        type="text"
        aria-describedby="player-name-help"
        pInputText
        placeholder="Player name"
        [(ngModel)]="playerName"
      />
      <small id="player-name-help"
        ><span class="text-500">What's this player's name?</span></small
      >
    </div>

    <!-- Player color selection -->
    <div class="mt-5">
      <h3 class="text-600 text-lg font-semibold mt-0 mb-4">Player Color</h3>
      <div class="grid">
        @for (color of playerColorArray; track color) {
        <div
          [class]="
            'col-3 py-1 my-2 border-round ' +
            (selectedColor === color ? 'selected' : '')
          "
          [id]="color"
          (click)="selectColor($event)"
        >
          <turnt-player-icon
            [playerColor]="color"
            class="flex justify-content-center"
          />
        </div>
        }
      </div>
    </div>

    <p-button
      styleClass="w-full mt-6"
      [disabled]="!playerName || !selectedColor"
    >
      <div class="w-full font-semibold text-center">
        Create {{ playerName || 'Player' }}
      </div></p-button
    >`,
  styles: `.selected {
    outline: solid var(--surface-300);
    }`,
})
export class NewPlayerPageComponent {
  playerName: string | undefined;

  // make the PlayerColors enum available in component template
  readonly PlayerColors = PlayerColors;
  readonly playerColorArray = Object.values(PlayerColors);

  selectedColor: string | undefined | null;
  readonly selectedColorStyle = '';

  selectColor(event: Event) {
    let target = event.target as HTMLElement;

    while (target.parentElement && !target.id) {
      target = target.parentElement;
    }

    if (target.id) {
      this.selectedColor = target.id;
    }
  }
}
