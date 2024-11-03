import { Component, computed, inject } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../shared/header.component';
import { PlayerColors, PlayerService } from '../data-access/player.service';
import { PlayerIconComponent } from '../shared/player-icon.component';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'time-rush-new-player-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FormsModule,
    InputTextModule,
    PlayerIconComponent,
    ButtonModule,
  ],
  template: `<time-rush-header
      text="New Player"
      alwaysSmall
      routeToPreviousPage="new-game"
    />
    <!-- Player name input -->
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
        @for (playerColor of playerColorArray(); track playerColor.value) {
        <div
          [class]="
            'col-3 py-1 my-2 border-round ' +
            (selectedColor === playerColor.value ? 'selected' : '')
          "
          [id]="playerColor.value"
          (click)="selectColor($event)"
        >
          <time-rush-player-icon
            [playerColor]="playerColor.value"
            [disabled]="playerColor.disabled"
            class="flex justify-content-center"
          />
        </div>
        }
      </div>
    </div>

    <p-button
      styleClass="w-full mt-6"
      [disabled]="!playerName || !selectedColor"
      (click)="createPlayer()"
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
  private readonly playerService = inject(PlayerService);
  private readonly router = inject(Router);

  private readonly players = this.playerService.players;

  playerName: string | undefined;

  // make the PlayerColors enum available in component template
  readonly PlayerColors = PlayerColors;
  readonly disabledColors = computed(() =>
    this.players().map((player) => player.color)
  );
  readonly playerColorArray = computed(() =>
    Object.values(PlayerColors).map((color) => ({
      value: color,
      disabled: this.disabledColors().includes(color),
    }))
  );

  selectedColor: string | undefined | null;

  selectColor(ev: Event) {
    let target = ev.target as HTMLElement;

    while (target.parentElement && !target.id) {
      target = target.parentElement;
    }

    if (target.id && !this.disabledColors().includes(target.id)) {
      this.selectedColor = target.id;
    }
  }

  createPlayer(): void {
    this.playerService.createPlayer({
      display_name: this.playerName!,
      color: this.selectedColor!,
      position: this.players().length,
    });

    this.router.navigate(['/new-game']);
  }
}
