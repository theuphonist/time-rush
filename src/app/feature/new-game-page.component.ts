import { Component, inject, signal, WritableSignal } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { InputTextModule } from 'primeng/inputtext';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { SelectButtonModule } from 'primeng/selectbutton';
import { GameService } from '../data-access/game.service';
import { MessageService } from 'primeng/api';
import {
  TimeUnits,
  GameTypes,
  ToFormGroup,
  LocalStorageKeys,
  GameFormViewModel,
} from '../shared/types';
import { LocalStorageService } from '../data-access/local-storage.service';

@Component({
  selector: 'time-rush-new-game-page',
  standalone: true,
  imports: [
    HeaderComponent,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    InputNumberModule,
    DropdownModule,
    ButtonModule,
    SelectButtonModule,
  ],
  template: `
    <time-rush-header text="New Game" alwaysSmall routeToPreviousPage="/home" />
    <form [formGroup]="newGameForm" (ngSubmit)="onStartGameButtonClick()">
      <div class="mt-page-content">
        <label>
          <span class="text-600 text-lg font-semibold">Game Name</span>
          <input
            class="w-full mt-2 mb-1"
            type="text"
            aria-describedby="game-name-help"
            pInputText
            placeholder="Game name"
            formControlName="name"
            (ngModelChange)="onInputChange()"
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
              formControlName="turnLength"
              (ngModelChange)="onInputChange()"
            />
            <p-dropdown
              [options]="timeUnits"
              (ngModelChange)="onInputChange()"
              formControlName="turnLengthUnits"
            />
          </div>
        </label>
        <small id="turn-length-help"
          ><span class="text-500"
            >What's the time limit for each turn?</span
          ></small
        >
      </div>

      <!-- Game type -->
      <div class="mt-5 w-full">
        <label>
          <span class="text-600 text-lg font-semibold">Game Type</span>
          <p-selectButton
            styleClass="mt-3 w-full"
            [options]="gameTypeOptions"
            [unselectable]="true"
            size="small"
            formControlName="gameType"
          />
        </label>
      </div>

      <p-button
        class="w-full"
        styleClass="w-full mt-6"
        type="submit"
        [disabled]="!newGameForm.valid"
      >
        <div
          class="w-full font-semibold flex justify-content-center align-items-center gap-2"
        >
          <span>Add players</span><i class="pi pi-arrow-right"></i>
        </div>
      </p-button>
    </form>
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
  private readonly gameService = inject(GameService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly localStorageService = inject(LocalStorageService);

  readonly newGameForm: ToFormGroup<GameFormViewModel> = this.formBuilder.group(
    {
      name: ['', Validators.required],
      turnLength: [0, Validators.required],
      turnLengthUnits: [TimeUnits.Seconds, Validators.required],
      gameType: [GameTypes.Local, Validators.required],
    }
  );

  readonly inputTimer: WritableSignal<ReturnType<typeof setTimeout> | null> =
    signal(null);

  readonly gameTypeOptions = [
    { label: "Pass 'n' Play", value: GameTypes.Local },
    { label: 'Online', value: GameTypes.Online },
  ];

  readonly timeUnits = Object.values(TimeUnits);

  ngOnInit(): void {
    const lastNewGameForm = this.localStorageService.getItem(
      LocalStorageKeys.NewGameForm
    ) as Partial<GameFormViewModel>;

    if (lastNewGameForm) {
      this.newGameForm.patchValue(lastNewGameForm);
    }
  }

  onInputChange(): void {
    const inputTimer = this.inputTimer();
    if (inputTimer) {
      clearTimeout(inputTimer);
    }

    this.inputTimer.set(setTimeout(() => this.onSaveQueueTimerExpired(), 1000));
  }

  onSaveQueueTimerExpired(): void {
    this.localStorageService.setItem(
      LocalStorageKeys.NewGameForm,
      this.newGameForm.value
    );
  }

  onStartGameButtonClick(): void {
    // all game props should be defined here, but just in case
    if (!this.newGameForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Failed to create game',
        detail: 'Missing required fields',
      });
      return;
    }

    const newGame = this.newGameForm.value as GameFormViewModel;

    this.localStorageService.setItem(LocalStorageKeys.NewGameForm, newGame);

    if (newGame.gameType === GameTypes.Local) {
      this.gameService.createGame(newGame);
      this.router.navigate(['/manage-players']);
      return;
    }

    this.gameService.createGame(newGame).then(
      (newGame) => {
        if (!newGame) {
          this.messageService.add({
            severity: 'error',
            summary: 'Failed to create game',
            detail: 'An unknown error occurred',
          });
          return;
        }

        this.router.navigate(['/lobby']);
      },
      (err) =>
        this.messageService.add({
          severity: 'error',
          summary: 'Failed to create game',
          detail: 'An unknown error occurred',
        })
    );
  }

  readonly GameTypes = GameTypes;
}
