import { Component, computed, inject, signal } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { JOIN_CODE_REGEX } from '../shared/constants';
import { GameService } from '../data-access/game.service';
import { PlayerService } from '../data-access/player.service';

@Component({
  selector: 'time-rush-home-page',
  standalone: true,
  imports: [HeaderComponent, InputTextModule, FormsModule, ButtonModule],
  template: `
    <time-rush-header text="Time Rush" />
    <!-- Join code input -->
    <div class="mt-page-content">
      <label for="join-code">
        <span class="text-600 text-lg font-semibold"
          >Join an existing game:</span
        >
      </label>
      <div class="flex mt-2 mb-1 gap-2">
        <input
          class="w-full"
          id="join-code"
          type="text"
          aria-describedby="join-code-description"
          pInputText
          placeholder="Join code"
          [ngModel]="joinCode()"
          (ngModelChange)="joinCode.set($event.toUpperCase())"
          (keydown.enter)="onJoinGameButtonClick()"
        />
        <p-button
          icon="pi pi-arrow-right"
          [disabled]="joinGameButtonDisabled()"
          (onClick)="onJoinGameButtonClick()"
        ></p-button>
      </div>
      <span class="hidden" id="join-code-description"
        >What is the code for the game you want to join?</span
      >
    </div>
    <p class="font-semibold text-xl text-center my-5">OR</p>
    <p-button
      styleClass="w-full font-bold"
      label="Create a new game"
      (click)="onCreateGameButtonClick()"
    />
  `,
})
export class HomePageComponent {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly gameService = inject(GameService);
  private readonly playerService = inject(PlayerService);

  readonly joinCode = signal('');

  readonly joinGameButtonDisabled = computed(
    () => !JOIN_CODE_REGEX.test(this.joinCode())
  );

  async onJoinGameButtonClick() {
    // shouldn't happen, but just in case
    if (!JOIN_CODE_REGEX.test(this.joinCode())) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to join game',
        detail: `${this.joinCode()} is not a valid join code.`,
      });
      return;
    }

    const upperCaseJoinCode = this.joinCode().toUpperCase();

    const game = await this.gameService.joinOnlineGame(upperCaseJoinCode);

    if (!game) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to join game',
        detail: `Could not find game with join code ${upperCaseJoinCode}.`,
      });
      return;
    }

    this.playerService.getOnlinePlayers(game.id);

    this.router.navigate(['/new-player']);
  }

  onCreateGameButtonClick() {
    this.router.navigate(['/new-game']);
  }
}
