import { Component, computed, inject, input, OnInit } from '@angular/core';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { PlayerFormViewModel, ToFormGroup } from '../shared/types';
import { PlayerService } from '../data-access/player.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { GameService } from '../data-access/game.service';

@Component({
  selector: 'time-rush-edit-player-page',
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
      text="Edit Player"
      alwaysSmall
      [routeToPreviousPage]="isLocalGame() ? '/manage-players' : '/lobby'"
    />
    <form [formGroup]="editPlayerForm" (ngSubmit)="onUpdatePlayerButtonClick()">
      <!-- Player name input -->
      <div class="mt-page-content">
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
        label="Save changes"
        type="submit"
        [disabled]="!editPlayerForm.valid"
      />

      @if (isLocalGame()) {
      <p-button
        styleClass="w-full mt-6"
        severity="danger"
        [label]="'Delete ' + (originalPlayer()?.name || 'Player')"
        type="button"
        (click)="onDeletePlayerButtonClick()"
      />
      }
    </form> `,
})
export class EditPlayerPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly playerService = inject(PlayerService);
  private readonly gameService = inject(GameService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly playerId = input.required<string>();

  readonly isLocalGame = this.gameService.isLocalGame;

  readonly originalPlayer = computed(() =>
    this.playerService.players().find((player) => player.id === this.playerId())
  );

  readonly editPlayerForm: ToFormGroup<PlayerFormViewModel> =
    this.formBuilder.group({
      name: ['', Validators.required],
      color: ['#FF0000', Validators.required],
    });

  ngOnInit() {
    this.editPlayerForm.patchValue({ ...this.originalPlayer() });
  }

  readonly nameControlSignal = toSignal(
    this.editPlayerForm.get('name')!.valueChanges
  );

  readonly colorControlSignal = toSignal(
    this.editPlayerForm.get('color')!.valueChanges
  );

  onUpdatePlayerButtonClick(): void {
    if (!this.editPlayerForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error updating player',
        detail: 'Missing required fields.',
      });
      return;
    }

    if (this.isLocalGame()) {
      this.playerService.updateLocalPlayer(
        this.playerId(),
        this.editPlayerForm.value as PlayerFormViewModel
      );

      this.router.navigate(['/manage-players']);
      return;
    }

    this.playerService.updateOnlinePlayer(
      this.playerId(),
      this.editPlayerForm.value as PlayerFormViewModel
    );

    this.router.navigate(['/lobby']);
  }

  onDeletePlayerButtonClick() {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${
        this.originalPlayer()?.name ?? 'this player'
      }?`,
      header: 'Delete Player',
      accept: () => {
        this.playerService.deleteLocalPlayer(this.playerId());
        this.router.navigate(['/manage-players']);
      },
      acceptButtonStyleClass: 'bg-red-400 border-none w-4rem ml-2',
      rejectButtonStyleClass: 'p-button-text w-4rem',
      acceptIcon: 'none',
      rejectIcon: 'none',
    });
  }
}
