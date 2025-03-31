import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../ui/header.component';

@Component({
  selector: 'time-rush-home-page',
  standalone: true,
  imports: [HeaderComponent, RouterLink],
  template: `
    <time-rush-header text="Time Rush" />
    <div class="mt-page-content flex flex-column align-items-center gap-2">
      <a
        class="w-full p-button font-bold flex justify-content-center gap-2 no-underline"
        routerLink="/join-game"
      >
        <i class="pi pi-sign-in"></i>
        <span>Join an existing game</span>
      </a>
      <p class="font-semibold text-xl">OR</p>
      <a
        class="w-full p-button font-bold flex justify-content-center gap-2 no-underline"
        routerLink="/new-game"
      >
        <i class="pi pi-plus"></i>
        <span>Create a new game</span>
      </a>
    </div>
  `,
})
export class HomePageComponent {}
