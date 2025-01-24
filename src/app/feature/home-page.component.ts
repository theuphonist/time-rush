import { Component, inject, signal } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CLEAR_LOCAL_STORAGE_JOIN_CODE } from '../shared/constants';

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
          [(ngModel)]="joinCode"
        />
        <p-button
          icon="pi pi-arrow-right"
          (onClick)="onJoinGameButtonClick()"
        ></p-button>
      </div>
      <small id="join-code-description"
        ><span class="text-500"
          >What is the code for the game you want to join?</span
        ></small
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

  readonly joinCode = signal('');

  onJoinGameButtonClick() {
    if (this.joinCode() === CLEAR_LOCAL_STORAGE_JOIN_CODE) {
      localStorage.clear();
      window.location.reload();
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Not so fast!',
      detail: "That button doesn't do anything yet",
    });
  }

  onCreateGameButtonClick() {
    this.router.navigate(['/new-game']);
  }
}
