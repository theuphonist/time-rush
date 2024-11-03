import {
  Component,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../shared/header.component';
import { PlayerColors, PlayerService } from '../data-access/player.service';
import { PlayerIconComponent } from '../shared/player-icon.component';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'time-rush-edit-player-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FormsModule,
    InputTextModule,
    PlayerIconComponent,
    ButtonModule,
  ],
  template: `<time-rush-header
      text="Edit Player"
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
      (click)="updatePlayer()"
      [disabled]="!playerName || !selectedColor"
    >
      <div class="w-full font-semibold text-center">
        Update {{ originalPlayer()?.display_name || 'Player' }}
      </div></p-button
    >
    <p-button
      styleClass="w-full mt-6"
      severity="danger"
      (click)="deletePlayer()"
    >
      <div class="w-full font-semibold text-center">
        Delete {{ originalPlayer()?.display_name || 'Player' }}
      </div></p-button
    >`,
  styles: `.selected {
    outline: solid var(--surface-300);
    }`,
})
export class EditPlayerPageComponent {
  private readonly playerService = inject(PlayerService);
  private readonly router = inject(Router);

  originalPlayerName: string | undefined;
  playerName: string | undefined;
  selectedColor: string | undefined | null;

  readonly playerId = input(0, { transform: numberAttribute });

  private readonly players = this.playerService.players;
  readonly originalPlayer = computed(() =>
    this.playerService.players().find((player) => player.id === this.playerId())
  );

  // make the PlayerColors enum available in component template
  readonly PlayerColors = PlayerColors;
  readonly disabledColors = computed(() =>
    this.players()
      .filter((player) => player.id !== this.playerId())
      .map((player) => player.color)
  );
  readonly playerColorArray = computed(() =>
    Object.values(PlayerColors).map((color) => ({
      value: color,
      disabled: this.disabledColors().includes(color),
    }))
  );

  ngOnInit() {
    this.playerName = this.originalPlayer()?.display_name;
    this.selectedColor = this.originalPlayer()?.color;
  }

  selectColor(ev: Event) {
    let target = ev.target as HTMLElement;

    // find element that has an associated color id. this may be a parent of the original event target
    while (target.parentElement && !target.id) {
      target = target.parentElement;
    }

    if (target.id && !this.disabledColors().includes(target.id)) {
      this.selectedColor = target.id;
    }
  }

  updatePlayer(): void {
    this.playerService.updatePlayer(this.playerId(), {
      display_name: this.playerName!,
      color: this.selectedColor!,
    });
    this.router.navigate(['/new-game']);
  }

  deletePlayer(): void {
    this.playerService.deletePlayer(this.playerId());
    this.router.navigate(['/new-game']);
  }
}
