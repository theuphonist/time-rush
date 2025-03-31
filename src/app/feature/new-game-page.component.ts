import {
  Component,
  computed,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SessionStorageService } from '../data-access/session-storage.service';
import { StateService } from '../data-access/state.service';
import { HeaderComponent } from '../ui/header.component';
import { GameForm, GameTypes, TimeUnits } from '../util/game-types';
import { SessionStorageKeys } from '../util/session-storage-types';
import { ToFormGroup } from '../util/utility-types';

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
            pInputText
            placeholder="Game name"
            formControlName="name"
            (ngModelChange)="onInputChange()"
            aria-description="What should this game be called?"
          />
        </label>
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
      </div>

      <!-- Game type -->
      <div class="mt-5 w-full">
        <label>
          <span class="text-600 text-lg font-semibold">Game Type</span>
          <p-selectButton
            styleClass="mt-2 w-full"
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
          <span>{{ submitButtonLabel() }}</span>
          <i class="pi pi-arrow-right"></i>
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
  private readonly messageService = inject(MessageService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly state = inject(StateService);

  readonly newGameForm: ToFormGroup<GameForm> = this.formBuilder.group({
    name: ['', Validators.required],
    turnLength: [0, [Validators.required, Validators.min(1)]],
    turnLengthUnits: [TimeUnits.Seconds, Validators.required],
    gameType: [GameTypes.Local, Validators.required],
  });

  readonly gameTypeControlSignal = toSignal(
    this.newGameForm.get('gameType')!.valueChanges
  );

  private readonly inputTimer: WritableSignal<ReturnType<
    typeof setTimeout
  > | null> = signal(null);

  readonly gameTypeOptions = [
    { label: "Pass 'n' Play", value: GameTypes.Local },
    { label: 'Online', value: GameTypes.Online },
  ];

  readonly timeUnits = Object.values(TimeUnits);

  readonly submitButtonLabel = computed(() =>
    this.gameTypeControlSignal() === GameTypes.Local
      ? 'Add players'
      : 'Game lobby'
  );

  ngOnInit(): void {
    const lastNewGameForm = this.sessionStorageService.getItem(
      SessionStorageKeys.NewGameForm
    ) as Partial<GameForm>;

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
    this.sessionStorageService.setItem(
      SessionStorageKeys.NewGameForm,
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

    const gameForm = this.newGameForm.value as GameForm;

    this.sessionStorageService.setItem(
      SessionStorageKeys.NewGameForm,
      gameForm
    );

    this.state.dispatch(this.state.actions.createGameButtonClicked, {
      gameForm,
    });
  }
}
