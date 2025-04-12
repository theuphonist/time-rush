import { Component, computed, inject, input } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { PlayerService } from '../data-access/player.service';
import { StateService } from '../data-access/state.service';
import { HeaderComponent } from '../ui/header.component';
import { PlayerFormComponent } from '../ui/player-form.component';
import { PlayerForm } from '../util/player-types';

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
    PlayerFormComponent,
  ],
  template: `
    <time-rush-header
      text="Edit Player"
      alwaysSmall
      [routeToPreviousPage]="isLocalGame() ? '/manage-players' : '/lobby'"
    />
    <main class="mt-page-content">
      <time-rush-player-form
        [initialValue]="originalPlayer()"
        [submitButtonLabel]="'Update ' + (originalPlayer()?.name ?? 'Player')"
        (submitButtonClick)="onUpdatePlayerButtonClick($event)"
      />
    </main>
  `,
})
export class EditPlayerPageComponent {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly playerService = inject(PlayerService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly state = inject(StateService);

  readonly playerId = input.required<string>();

  readonly isLocalGame = this.state.selectIsLocalGame;

  readonly originalPlayer = computed(() =>
    this.state.selectPlayers()?.find((player) => player.id === this.playerId())
  );

  onUpdatePlayerButtonClick(playerForm: PlayerForm): void {
    this.state.dispatch(this.state.actions.updatePlayerButtonClicked, {
      playerId: this.playerId(),
      playerForm,
    });
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
