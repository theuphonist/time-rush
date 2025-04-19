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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
    ProgressSpinnerModule,
  ],
  template: `
    <time-rush-header text="New Game" alwaysSmall routeToPreviousPage="/home" />
    <main class="mt-page-content">
      <form
        [formGroup]="newGameForm"
        (ngSubmit)="onStartGameButtonClick()"
        class="flex flex-column gap-5"
      >
        <div class="flex flex-column gap-2">
          <label for="game-name-input">
            <span class="text-600 text-lg font-semibold">Game Name</span>
          </label>
          <input
            class="w-full"
            type="text"
            pInputText
            placeholder="Game name"
            formControlName="name"
            (ngModelChange)="onInputChange()"
            id="game-name-input"
            aria-description="What should this game be called?"
          />
        </div>

        <!-- Turn length input -->
        <div class="flex flex-column gap-2">
          <label for="turn-length-input">
            <span class="text-600 text-lg font-semibold">Turn Length</span>
          </label>
          <div class="flex gap-3">
            <p-inputNumber
              inputStyleClass="w-8rem"
              [showButtons]="true"
              buttonLayout="horizontal"
              incrementButtonIcon="pi pi-plus"
              decrementButtonIcon="pi pi-minus"
              [min]="1"
              placeholder="Turn length"
              formControlName="turnLength"
              (ngModelChange)="onInputChange()"
              inputId="turn-length-input"
            />
            <p-dropdown
              [options]="timeUnits"
              (ngModelChange)="onInputChange()"
              formControlName="turnLengthUnits"
              ariaLabel="Turn length units"
            />
          </div>
        </div>

        <!-- Game type -->
        <div class="flex flex-column gap-2">
          <label>
            <span class="text-600 text-lg font-semibold">Game Type</span>
          </label>
          <p-selectButton
            [options]="gameTypeOptions"
            [unselectable]="true"
            size="small"
            formControlName="gameType"
          />
        </div>

        <p-button
          class="w-full"
          styleClass="w-full"
          [style]="{ height: '2.25rem' }"
          type="submit"
          [disabled]="!newGameForm.valid"
          [ariaLabel]="submitButtonLabel()"
        >
          <div
            class="w-full font-semibold flex justify-content-center align-items-center gap-2"
          >
            <span>{{ submitButtonLabel() }}</span>
            @if (loading()) {
              <p-progressSpinner styleClass="h-1rem w-1rem" strokeWidth="4" />
            } @else {
              <i class="pi pi-arrow-right h-1rem"></i>
            }
          </div>
        </p-button>
      </form>
    </main>
  `,
  styles: `
    .cdk-drop-list-dragging .cdk-drag {
      transition: transform 350ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drag-animating {
      transition: transform 300ms cubic-bezier(0, 0, 0.2, 1);
    }

    :host ::ng-deep {
      .p-progress-spinner-circle {
        stroke: var(--surface-ground) !important;
      }
    }
  `,
})
export class NewGamePageComponent {
  private readonly messageService = inject(MessageService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly state = inject(StateService);

  readonly loading = this.state.selectLoading;

  readonly newGameForm: ToFormGroup<GameForm> = this.formBuilder.group({
    name: ['', Validators.required],
    turnLength: [0, [Validators.required, Validators.min(1)]],
    turnLengthUnits: [TimeUnits.Seconds, Validators.required],
    gameType: [GameTypes.Local, Validators.required],
  });

  readonly gameTypeControlSignal = toSignal(
    this.newGameForm.get('gameType')!.valueChanges,
  );

  private readonly inputTimer: WritableSignal<ReturnType<
    typeof setTimeout
  > | null> = signal(null);

  readonly gameTypeOptions = [
    {
      label: "Pass 'n' Play",
      value: GameTypes.Local,
    },
    { label: 'Online', value: GameTypes.Online },
  ];

  readonly timeUnits = Object.values(TimeUnits);

  readonly submitButtonLabel = computed(() =>
    this.gameTypeControlSignal() === GameTypes.Local
      ? 'Add players'
      : 'Game lobby',
  );

  ngOnInit(): void {
    const lastNewGameForm = this.sessionStorageService.getItem(
      SessionStorageKeys.NewGameForm,
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
      this.newGameForm.value,
    );
  }

  onStartGameButtonClick(): void {
    // all game props should be defined here, but just in case
    if (!this.newGameForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Create Game Error',
        detail: 'Missing required fields.',
      });
      return;
    }

    const gameForm = this.newGameForm.value as GameForm;

    this.sessionStorageService.setItem(
      SessionStorageKeys.NewGameForm,
      gameForm,
    );

    this.state.dispatch(this.state.actions.createGameButtonClicked, {
      gameForm,
    });
  }
}
