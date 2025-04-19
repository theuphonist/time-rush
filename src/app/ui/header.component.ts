import {
  booleanAttribute,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'time-rush-header',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <header
      class="flex fixed top-0 left-0 w-full h-6rem align-items-end background-blur pb-2 z-5"
      [class.header-border]="alwaysSmall()"
    >
      @if (!alwaysSmall()) {
        <h1 class="my-0 w-full large-header">{{ text() }}</h1>
      } @else {
        <div class="w-full grid">
          <div class="col-2 text-center">
            @if (routeToPreviousPage()) {
              <a [routerLink]="routeToPreviousPage()">
                <i [class]="'text-primary pi ' + _backButtonIcon()"></i>
              </a>
            } @else {
              <p-button
                styleClass="p-0"
                [icon]="'pi ' + _backButtonIcon()"
                [text]="true"
                (click)="backButtonClick.emit()"
              />
            }
          </div>
          <div class="col-8 text-center">
            <h3 class="my-0 justify-self-center small-header">
              {{ text() }}
            </h3>
          </div>
        </div>
      }
    </header>
  `,
  styles: `
    .background-blur {
      backdrop-filter: blur(18px);
    }
    .large-header {
      margin-left: var(--base-x-padding-margin);
      margin-right: var(--base-x-padding-margin);
    }
    .header-border {
      border-bottom: solid 1px var(--surface-border);
    }
  `,
})
export class HeaderComponent {
  private readonly confirmationService = inject(ConfirmationService);

  readonly text = input.required<string>();
  readonly alwaysSmall = input(false, { transform: booleanAttribute });
  readonly routeToPreviousPage = input<string>();
  readonly backButtonIcon = input<string>();

  readonly backButtonClick = output();

  readonly _backButtonIcon = computed(() =>
    this.backButtonIcon() ? this.backButtonIcon() : 'pi-arrow-left',
  );
}
