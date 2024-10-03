import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { PlayerNameWithIconComponent } from '../shared/player-name-with-icon.component';
import { PlayerColors, PlayerService } from '../data-access/player.service';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { LocalStorageService } from '../data-access/local-storage.service';

@Component({
  selector: 'turnt-new-game-page',
  standalone: true,
  imports: [
    HeaderComponent,
    InputTextModule,
    FormsModule,
    InputNumberModule,
    DropdownModule,
    PlayerNameWithIconComponent,
    ButtonModule,
    RouterLink,
  ],
  template: `
    <turnt-header text="New Game" />
    <!-- Game name input -->
    <div class="mt-page-content">
      <label for="game-name"
        ><span class="text-600 text-lg font-semibold">Game Name</span></label
      >
      <input
        class="w-full mt-2 mb-1"
        id="game-name"
        type="text"
        aria-describedby="game-name-help"
        pInputText
        placeholder="Game name"
        [(ngModel)]="gameName"
      />
      <small id="game-name-help"
        ><span class="text-500">What should this game be called?</span></small
      >
    </div>

    <!-- Turn length input -->
    <div class="mt-5">
      <label for="turn-length"
        ><span class="text-600 text-lg font-semibold">Turn Length</span></label
      >
      <div class="flex mt-2 mb-1">
        <p-inputNumber
          class="mr-3"
          inputStyleClass="w-8rem"
          inputId="turn-length"
          [showButtons]="true"
          buttonLayout="horizontal"
          incrementButtonIcon="pi pi-plus"
          decrementButtonIcon="pi pi-minus"
          [min]="1"
          placeholder="Turn length"
          [(ngModel)]="turnLength"
        />
        <p-dropdown [options]="timeUnits" [(ngModel)]="selectedTimeUnits">
        </p-dropdown>
      </div>
      <small id="turn-length-help"
        ><span class="text-500"
          >What's the time limit for each turn?</span
        ></small
      >
    </div>

    <!-- Players -->
    <div class="mt-5">
      <h3 class="text-600 text-lg font-semibold mt-0 mb-2">Players</h3>

      @for (player of players(); track player.id) {
      <div
        style="border-bottom: 1px solid"
        class="flex align-items-center justify-content-between border-200"
      >
        <turnt-player-name-with-icon
          [playerColor]="player.color"
          [playerName]="player.display_name"
        />
        <a
          class="text-primary px-2 h-full"
          [routerLink]="'/edit-player/' + [player.id]"
        >
          <i class="pi pi-pencil"></i>
        </a>
      </div>
      }
      <a
        routerLink="/new-player"
        class="block flex align-items-center justify-content-center w-full mt-2 h-3rem mb-2 surface-200 border-transparent border-round text-500 no-underline"
        ><i class="pi pi-plus"></i
      ></a>
      <small
        ><span class="text-500"
          >Drag and drop players to set turn order.</span
        ></small
      >
    </div>
    <p-button styleClass="w-full mt-6">
      <div class="w-full font-semibold text-center">Let's go!</div></p-button
    >
  `,
})
export class NewGamePageComponent {
  private readonly playerService = inject(PlayerService);
  private readonly localStorageService = inject(LocalStorageService);

  readonly players = this.playerService.players;

  gameName: string | undefined;
  turnLength: number | undefined;

  readonly timeUnits: string[] = ['s', 'min'];
  selectedTimeUnits: string | undefined = this.timeUnits[0];

  // make the PlayerColors enum available in component template
  readonly PlayerColors = PlayerColors;
}
