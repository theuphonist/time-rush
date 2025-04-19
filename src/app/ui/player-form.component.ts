import { Component, inject, input, OnInit, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { getRandomPlayerColor } from '../util/helpers';
import { PlayerForm } from '../util/player-types';
import { ToFormGroup } from '../util/utility-types';
import { PlayerIconComponent } from './player-icon.component';

export type BuildSubmitLabelFn = (args: { playerForm: PlayerForm }) => string;

@Component({
  selector: 'time-rush-player-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ColorPickerModule,
    PlayerIconComponent,
  ],
  template: `
    <form [formGroup]="playerForm" (ngSubmit)="onSubmit()">
      <!-- Player name input -->
      <label>
        <span class="text-600 text-lg font-semibold">Player Name</span>
        <input
          class="w-full mt-2 mb-1"
          type="text"
          aria-description="Enter a name for this player"
          pInputText
          placeholder="Player name"
          formControlName="name"
          tabindex="0"
        />
      </label>

      <!-- Player color selection -->
      <div class="mt-5">
        <h3 class="text-600 text-lg font-semibold mt-0 mb-4">Player Color</h3>
        <div class="flex align-items-center">
          <p-colorPicker [inline]="true" formControlName="color" />
          <div class="w-full flex justify-content-center">
            <time-rush-player-icon [playerColor]="color() ?? '#000000'" />
          </div>
        </div>
      </div>

      <p-button
        styleClass="w-full mt-6"
        [label]="submitButtonLabel()"
        type="submit"
        [disabled]="!playerForm.valid"
        [attr.aria-label]="submitButtonLabel()"
        tabindex="0"
      />
    </form>
  `,
})
export class PlayerFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  readonly submitButtonLabel = input.required<string>();
  readonly initialValue = input<PlayerForm>();
  readonly submitButtonClick = output<PlayerForm>();

  readonly playerForm: ToFormGroup<PlayerForm> = this.formBuilder.group({
    name: ['', Validators.required],
    color: ['', Validators.required],
  });

  readonly color = toSignal(this.playerForm.get('color')!.valueChanges);

  ngOnInit() {
    const initialValue = this.initialValue() ?? {
      color: getRandomPlayerColor(),
    };

    if (initialValue) {
      this.playerForm.patchValue({ ...initialValue });
    }
  }

  onSubmit(): void {
    if (!this.playerForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error creating player',
        detail: 'Missing required fields.',
      });

      return;
    }

    this.submitButtonClick.emit(this.playerForm.value as PlayerForm);
  }
}
