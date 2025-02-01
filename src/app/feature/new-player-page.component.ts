import { Component, computed, inject, input } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HeaderComponent } from '../shared/header.component';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { ColorPickerModule } from 'primeng/colorpicker';
import { PlayerIconComponent } from '../shared/player-icon.component';
import { MessageService } from 'primeng/api';
import { GameTypes, PlayerFormViewModel, ToFormGroup } from '../shared/types';
import { PlayerService } from '../data-access/player.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { GameService } from '../data-access/game.service';

@Component({
  selector: 'time-rush-new-player-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ColorPickerModule,
    PlayerIconComponent,
  ],
  template: `<time-rush-header
      [text]="gameType() === GameTypes.Local ? 'New Player' : 'Join Game'"
      alwaysSmall
      [routeToPreviousPage]="
        gameType() === GameTypes.Local ? '/manage-players' : '/home'
      "
    />
    @if (gameType() === GameTypes.Online) {
    <p class="text-lg mt-page-content">
      You're joining
      <span class="font-bold">{{ game().name }} ({{ game().joinCode }})</span>
    </p>
    }
    <form [formGroup]="newPlayerForm" (ngSubmit)="onCreatePlayerButtonClick()">
      <!-- Player name input -->
      <div
        [class]="gameType() === GameTypes.Local ? 'mt-page-content' : 'mt-5'"
      >
        <label>
          <span class="text-600 text-lg font-semibold">Player Name</span>
          <input
            class="w-full mt-2 mb-1"
            type="text"
            aria-describedby="player-name-help"
            pInputText
            placeholder="Player name"
            formControlName="name"
          />
        </label>
        <span class="hidden" id="player-name-help"
          >What's this player's name?</span
        >
      </div>

      <!-- Player color selection -->
      <div class="mt-5">
        <h3 class="text-600 text-lg font-semibold mt-0 mb-4">Player Color</h3>
        <div class="flex align-items-center">
          <p-colorPicker [inline]="true" formControlName="color" />
          <div class="w-full flex justify-content-center">
            <time-rush-player-icon
              [playerColor]="colorControlSignal() ?? '#FF0000'"
            />
          </div>
        </div>
      </div>

      <p-button
        styleClass="w-full mt-6"
        [label]="createPlayerButtonLabel()"
        type="submit"
        [disabled]="!newPlayerForm.valid"
      />
    </form> `,
})
export class NewPlayerPageComponent {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly playerService = inject(PlayerService);
  private readonly gameService = inject(GameService);

  readonly gameType = input.required<GameTypes>();

  readonly game = this.gameService.game;

  readonly newPlayerForm: ToFormGroup<PlayerFormViewModel> =
    this.formBuilder.group({
      name: ['', Validators.required],
      color: ['#FF0000', Validators.required],
    });

  readonly nameControlSignal = toSignal(
    this.newPlayerForm.get('name')!.valueChanges
  );

  readonly colorControlSignal = toSignal(
    this.newPlayerForm.get('color')!.valueChanges
  );

  readonly createPlayerButtonLabel = computed(() => {
    if (this.gameType() === GameTypes.Local) {
      return 'Create ' + (this.nameControlSignal() ?? 'Player');
    }

    return `Join ${this.gameService.game().name}`;
  });

  onCreatePlayerButtonClick(): void {
    if (!this.newPlayerForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error creating player',
        detail: 'Missing required fields.',
      });
      return;
    }

    if (this.gameType() === GameTypes.Local) {
      this.playerService.createLocalPlayer(
        this.newPlayerForm.value as PlayerFormViewModel
      );

      this.router.navigate(['/manage-players']);
      return;
    }

    this.playerService.createOnlinePlayer(
      this.newPlayerForm.value as PlayerFormViewModel,
      this.gameService.game().id
    );

    this.router.navigate(['/lobby']);
  }

  readonly GameTypes = GameTypes;
}
