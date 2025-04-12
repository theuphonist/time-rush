import { Component, computed, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { StateService } from '../data-access/state.service';
import { HeaderComponent } from '../ui/header.component';
import { PlayerFormComponent } from '../ui/player-form.component';
import { PlayerForm } from '../util/player-types';

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
    PlayerFormComponent,
  ],
  template: `
    <time-rush-header
      [text]="isLocalGame() ? 'New Player' : 'Join Game'"
      alwaysSmall
      [routeToPreviousPage]="isLocalGame() ? '/manage-players' : '/home'"
    />
    <main class="mt-page-content">
      @if (!isLocalGame()) {
        <p class="text-lg">
          You're joining
          <span class="font-bold"
            >{{ game()?.name }} ({{ game()?.joinCode }})</span
          >
        </p>
      }
      <time-rush-player-form
        [submitButtonLabel]="createPlayerButtonLabel()"
        (submitButtonClick)="onCreatePlayerButtonClick($event)"
      />
    </main>
  `,
})
export class NewPlayerPageComponent {
  private readonly state = inject(StateService);

  readonly game = this.state.selectGame;
  readonly isLocalGame = this.state.selectIsLocalGame;

  readonly createPlayerButtonLabel = computed(() =>
    this.isLocalGame()
      ? 'Create Player'
      : `Join ${this.game()?.name ?? 'Game'}`,
  );

  onCreatePlayerButtonClick(playerForm: PlayerForm): void {
    this.state.dispatch(this.state.actions.createPlayerButtonClicked, {
      playerForm,
    });
  }
}
