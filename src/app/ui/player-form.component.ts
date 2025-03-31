import { AsyncPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
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
    AsyncPipe,
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
            <time-rush-player-icon
              [playerColor]="(color$ | async) ?? '#FF0000'"
            />
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
export class PlayerFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly submitButtonLabel = input.required<string>();
  readonly submitButtonClick = output<PlayerForm>();

  readonly playerForm: ToFormGroup<PlayerForm> = this.formBuilder.group({
    name: ['', Validators.required],
    color: ['#FF0000', Validators.required],
  });

  readonly color$ = this.playerForm.get('color')!.valueChanges;

  onSubmit(): void {
    if (!this.playerForm.valid) {
      return;
    }

    this.submitButtonClick.emit(this.playerForm.value as PlayerForm);
  }
}
