import { Component, inject, signal, WritableSignal } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { PlayerNameWithIconComponent } from '../shared/player-name-with-icon.component';
import { PlayerColors, PlayerService } from '../data-access/player.service';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import { SelectButtonModule } from 'primeng/selectbutton';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDragPreview,
} from '@angular/cdk/drag-drop';
import { GameModel, GameService, TimeUnits } from '../data-access/game.service';
import { ApiService } from '../data-access/api.service';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';

enum GameTypes {
  Local = 'local',
  Online = 'online',
}

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
    SelectButtonModule,
  ],
  template: `
    <time-rush-header text="New Game" alwaysSmall routeToPreviousPage="/home" />
    @if (viewModel(); as vm) {
    <div class="mt-page-content">
      <label>
        <span class="text-600 text-lg font-semibold">Game Name</span>
        <input
          class="w-full mt-2 mb-1"
          type="text"
          aria-describedby="game-name-help"
          pInputText
          placeholder="Game name"
          [(ngModel)]="vm.name"
          (ngModelChange)="onInputChange({ name: $event })"
        />
      </label>
      <small id="game-name-help"
        ><span class="text-500">What should this game be called?</span></small
      >
    </div>

    <!-- Turn length input -->
    <div class="mt-5">
      <label>
        <span class="text-600 text-lg font-semibold">Turn Length</span>
        <div class="flex mt-2 mb-1">
          <p-inputNumber
            class="mr-3"
            inputStyleClass="w-8rem"
            [showButtons]="true"
            buttonLayout="horizontal"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            [min]="1"
            placeholder="Turn length"
            [(ngModel)]="vm.turnLength"
            (ngModelChange)="onInputChange({ turnLength: $event })"
          />
          <p-dropdown
            [options]="timeUnits"
            [(ngModel)]="vm.turnLengthUnits"
            (ngModelChange)="onInputChange({ turnLengthUnits: $event })"
          >
          </p-dropdown>
        </div>
      </label>
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

    <!-- Game type -->
    <div class="mt-5 w-full">
      <label>
        <span class="text-600 text-lg font-semibold">Game Type</span>
        <p-selectButton
          styleClass="mt-3 w-full"
          [options]="gameTypes"
          [(ngModel)]="selectedGameType"
          optionLabel="label"
          optionValue="value"
          [unselectable]="true"
          size="small"
        />
      </label>
    </div>
    <p-button
      class="w-full"
      styleClass="w-full mt-6"
      label="Let's go!"
      (click)="onStartGameButtonClick()"
      [disabled]="!vm.name || !vm.turnLength || !vm.turnLengthUnits"
    />
    }
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
  private readonly apiService = inject(ApiService);
  private readonly messageService = inject(MessageService);
  private readonly httpClient = inject(HttpClient);

  readonly players = this.playerService.players;

  readonly viewModel: WritableSignal<GameModel | null> = signal(null);
  private readonly viewModelUpdates: WritableSignal<Partial<GameModel>> =
    signal({});
  readonly gameInfo = this.gameService.gameInfo;

  readonly inputTimer: WritableSignal<ReturnType<typeof setTimeout> | null> =
    signal(null);

  readonly gameTypes = [
    { label: "Pass 'n' Play", value: GameTypes.Local },
    { label: 'Online', value: GameTypes.Online },
  ];
  readonly selectedGameType: WritableSignal<GameTypes> = signal(
    GameTypes.Local
  );

  // make enums available in component template
  readonly PlayerColors = PlayerColors;
  readonly timeUnits = Object.values(TimeUnits);

  ngOnInit(): void {
    this.viewModel.set({
      name: this.gameService.gameInfo().name,
      turnLength: this.gameService.gameInfo().turnLength,
      turnLengthUnits: this.gameService.gameInfo().turnLengthUnits,
    });
  }

  onInputChange(inputChange: Partial<GameModel>): void {
    this.viewModelUpdates.update((viewModelUpdates) => ({
      ...viewModelUpdates,
      ...inputChange,
    }));
    if (this.inputTimer()) {
      clearTimeout(this.inputTimer()!);
    }
    this.inputTimer.set(setTimeout(() => this.onSaveQueueTimerExpired(), 1000));
  }

  onSaveQueueTimerExpired(): void {
    this.gameService.updateGameInfo({ ...(this.viewModelUpdates() ?? {}) });
    this.viewModelUpdates.set({});
  }

  onPlayerDrop(ev: CdkDragDrop<string[]>): void {
    this.playerService.swapPlayers(ev.previousIndex, ev.currentIndex);
  }

  onStartGameButtonClick(): void {
    const game = this.viewModel();

    // all game props should be defined here, but just in case
    if (!game) {
      this.messageService.add({
        severity: 'error',
        summary: 'Create Game Failed',
        detail: 'Missing required fields',
      });
      return;
    }

    if (this.selectedGameType() === GameTypes.Local) {
      this.playerService.changeActivePlayer(this.players()[0].id);
      this.router.navigate(['/active-game']);
      return;
    }

    this.apiService.createGame(game);
  }
}
