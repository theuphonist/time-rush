import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { StateService } from '../data-access/state.service';
import { HeaderComponent } from '../ui/header.component';
import { JOIN_CODE_REGEX } from '../util/constants';

@Component({
  selector: 'time-rush-join-game-page',
  standalone: true,
  imports: [HeaderComponent, ButtonModule, FormsModule, InputTextModule],
  template: `
    <time-rush-header
      text="Join Game"
      alwaysSmall
      routeToPreviousPage="/home"
    />
    <main class="mt-page-content">
      <!-- Join code input -->
      <label for="join-code">
        <span class="text-600 text-lg font-semibold">Enter a join code:</span>
      </label>
      <div class="flex mt-2 mb-1 gap-2">
        <input
          class="w-full"
          id="join-code"
          type="text"
          pInputText
          placeholder="Join code"
          [(ngModel)]="joinCode"
          (keydown.enter)="onJoinGameButtonClick()"
          aria-description="Enter a join code"
        />
        <p-button
          icon="pi pi-sign-in"
          [disabled]="joinGameButtonDisabled()"
          (onClick)="onJoinGameButtonClick()"
        ></p-button>
      </div>
    </main>
  `,
})
export class JoinGamePageComponent {
  private readonly messageService = inject(MessageService);
  private readonly state = inject(StateService);

  readonly joinCode = signal('');

  readonly joinGameButtonDisabled = computed(
    () => !JOIN_CODE_REGEX.test(this.joinCode()),
  );

  onJoinGameButtonClick() {
    // shouldn't happen, but just in case
    if (!JOIN_CODE_REGEX.test(this.joinCode())) {
      this.messageService.add({
        severity: 'error',
        summary: 'Join Game Error',
        detail: `${this.joinCode()} is not a valid join code.`,
      });
      return;
    }

    this.state.dispatch(this.state.actions.joinGameButtonClicked, {
      joinCode: this.joinCode(),
    });
  }
}
