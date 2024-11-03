import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { PlayerNameWithIconComponent } from '../shared/player-name-with-icon.component';
import { PlayerColors, PlayerService } from '../data-access/player.service';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDragPreview,
} from '@angular/cdk/drag-drop';
import { GameService } from '../data-access/game.service';

@Component({
  selector: 'time-rush-new-game-page',
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
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDragPreview,
    CdkDragHandle,
  ],
  template: `
    <time-rush-header text="New Game" />
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
      <div cdkDropList (cdkDropListDropped)="onPlayerDrop($event)">
        @for (player of players(); track player.id) {
        <div
          style="border-bottom: 1px solid"
          class="flex align-items-center justify-content-between border-200 h-4rem"
          cdkDrag
          cdkDragPreviewContainer="parent"
        >
          <div class="flex align-items-center">
            <div class="pi pi-bars px-3 py-2 text-400" cdkDragHandle></div>
            <time-rush-player-name-with-icon
              [playerColor]="player.color"
              [playerName]="player.display_name"
            />
          </div>
          <a
            class="text-primary px-2 py-2"
            [routerLink]="'/edit-player/' + [player.id]"
          >
            <i class="pi pi-pencil"></i>
          </a>
          <div class="surface-200 h-4rem w-full" *cdkDragPlaceholder></div>
          <div class="flex align-items-center surface-0 w-full" *cdkDragPreview>
            <div class="pi pi-bars px-3 py-2 text-400" cdkDragHandle></div>
            <time-rush-player-name-with-icon
              [playerColor]="player.color"
              [playerName]="player.display_name"
            />
          </div>
        </div>
        }
      </div>
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
    <p-button
      styleClass="w-full mt-6"
      (click)="startGame()"
      [disabled]="!gameName || !turnLength || !selectedTimeUnits"
    >
      <div class="w-full font-semibold text-center">Let's go!</div></p-button
    >
  `,
  styles: `
    .cdk-drop-list-dragging .cdk-drag {
      transition: transform 350ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .cdk-drag-animating {
      transition: transform 300ms cubic-bezier(0, 0, 0.2, 1);
    }
  `,
})
export class NewGamePageComponent {
  private readonly playerService = inject(PlayerService);
  private readonly gameService = inject(GameService);
  private readonly router = inject(Router);

  readonly players = this.playerService.players;

  gameName: string | undefined;
  turnLength: number | undefined;

  readonly timeUnits: string[] = ['s', 'min'];
  selectedTimeUnits: string | undefined = this.timeUnits[0];

  // make the PlayerColors enum available in component template
  readonly PlayerColors = PlayerColors;

  ngOnInit() {
    this.gameName = this.gameService.gameInfo().game_name;
    this.selectedTimeUnits = this.gameService.gameInfo().selected_time_units;
    this.turnLength =
      this.gameService.gameInfo().turn_length /
      1000 /
      (this.selectedTimeUnits === 'min' ? 60 : 1);
  }

  onPlayerDrop(ev: CdkDragDrop<string[]>) {
    this.playerService.swapPlayers(ev.previousIndex, ev.currentIndex);
  }

  startGame() {
    this.gameService.createGame({
      game_name: this.gameName!,
      turn_length:
        this.turnLength! * (this.selectedTimeUnits === 'min' ? 60 : 1) * 1000,
      selected_time_units: this.selectedTimeUnits!,
    });
    this.playerService.changeActivePlayer(this.players()[0].id);
    this.router.navigate(['/active-game']);
  }
}
