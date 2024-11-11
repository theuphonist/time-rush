import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'time-rush-home-page',
  standalone: true,
  imports: [
    HeaderComponent,
    InputTextModule,
    FormsModule,
    ButtonModule,
    RouterLink,
  ],
  template: `
    <time-rush-header text="Time Rush" />
    <!-- Session code input -->
    <div class="mt-page-content">
      <label for="session-code">
        <span class="text-600 text-lg font-semibold"
          >Enter a session code:</span
        >
      </label>
      <div class="flex mt-2 mb-1 gap-2">
        <input
          class="w-full"
          id="session-code"
          type="text"
          aria-describedby="session-code"
          pInputText
          placeholder="Session code"
          [(ngModel)]="sessionCode"
        />
        <p-button
          icon="pi pi-arrow-right"
          (onClick)="onJoinSessionButtonClick()"
        ></p-button>
      </div>
      <small id="session-code"
        ><span class="text-500"
          >What is the code for the session you want to join?</span
        ></small
      >
    </div>
    <p class="font-semibold text-xl text-center my-5">OR</p>
    <p-button
      styleClass="w-full font-bold"
      label="Start a new session"
      (click)="onStartSessionButtonClick()"
    />
  `,
})
export class HomePageComponent {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  sessionCode: string | undefined;

  onJoinSessionButtonClick() {
    this.messageService.add({
      severity: 'info',
      summary: 'Not so fast!',
      detail: "That button doesn't do anything yet",
    });
  }

  onStartSessionButtonClick() {
    this.router.navigate(['/new-game']);
  }
}
