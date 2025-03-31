import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { GameService } from '../data-access/game.service';
import { PlayerService } from '../data-access/player.service';
import { HeaderComponent } from '../ui/header.component';
import { PlayerIconComponent } from '../ui/player-icon.component';
import { PlayerForm } from '../util/player-types';
import { ToFormGroup } from '../util/utility-types';

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
      [text]="isLocalGame() ? 'New Player' : 'Join Game'"
      alwaysSmall
      [routeToPreviousPage]="isLocalGame() ? '/manage-players' : '/home'"
    />
    @if (!isLocalGame()) {
    <p class="text-lg mt-page-content">
      You're joining
      <span class="font-bold">{{ game().name }} ({{ game().joinCode }})</span>
    </p>
    }
    <form [formGroup]="newPlayerForm" (ngSubmit)="onCreatePlayerButtonClick()">
      <!-- Player name input -->
      <div [class]="isLocalGame() ? 'mt-page-content' : 'mt-5'">
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

  readonly game = this.gameService.game;
  readonly isLocalGame = this.gameService.isLocalGame;

  readonly newPlayerForm: ToFormGroup<PlayerForm> = this.formBuilder.group({
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
    if (this.isLocalGame()) {
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

    if (this.isLocalGame()) {
      this.playerService.createLocalPlayer(
        this.newPlayerForm.value as PlayerForm
      );

      this.router.navigate(['/manage-players']);
      return;
    }

    // this.playerService.createOnlinePlayer(
    //   this.newPlayerForm.value as PlayerForm,
    //   this.gameService.game().id,
    //   -1
    // );

    this.router.navigate(['/lobby']);
  }
}
