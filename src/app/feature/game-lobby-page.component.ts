import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, computed, inject } from '@angular/core';
import { Confirmation } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { StateService } from '../data-access/state.service';
import { HeaderComponent } from '../ui/header.component';
import { PlayerListComponent } from '../ui/player-list.component';
import { Player } from '../util/player-types';

@Component({
  selector: 'time-rush-game-lobby-page',
  standalone: true,
  imports: [HeaderComponent, PlayerListComponent, ButtonModule],
  template: `
    <time-rush-header
      [text]="game()?.name ?? 'Error!'"
      alwaysSmall
      backButtonIcon="pi-sign-out"
      [navigationConfirmation]="navigationConfirmation"
    />
    <main class="mt-page-content">
      @if (game() && connectedAndSortedPlayers().length) {
        @if (game(); as game) {
          <div class="flex gap-6">
            <div class="flex flex-column">
              <h2 class="text-600 text-lg font-semibold mt-0 mb-1">
                Join Code
              </h2>
              <p class="text-3xl font-bold m-0">{{ game.joinCode }}</p>
            </div>
            <div class="flex flex-column">
              <h2 class="text-600 text-lg font-semibold mt-0 mb-1">
                Turn Length
              </h2>
              <p class="text-3xl font-bold m-0">
                {{ game.turnLength }} {{ game.turnLengthUnits }}
              </p>
            </div>
          </div>
        }
        @if (connectedAndSortedPlayers(); as players) {
          @if (player(); as player) {
            <time-rush-player-list
              class="block mt-3"
              [players]="players"
              [editablePlayerIds]="editablePlayerIds()"
              [hostPlayerId]="hostPlayerId()"
              [reorderable]="playerIsHost()"
              (playerOrderChange)="onPlayerOrderChange($event)"
            />
          }
          @if (playerIsHost()) {
            <p-button
              class="w-full"
              styleClass="w-full mt-6"
              label="Let's go!"
              [disabled]="players.length < 2"
              (click)="onStartGameButtonClick()"
            />
          }
        }
      } @else {
        <p class="font-italic">
          Oops! Something went wrong... Return to the home page and create a new
          game to get started.
        </p>
      }
    </main>
  `,
})
export class GameLobbyPageComponent {
  private readonly state = inject(StateService);

  readonly game = this.state.selectGame;
  readonly connectedAndSortedPlayers =
    this.state.selectConnectedAndSortedPlayers;
  readonly player = this.state.selectPlayer;
  readonly playerId = this.state.selectPlayerId;
  readonly hostPlayerId = this.state.selectHostPlayerId;
  readonly playerIsHost = this.state.selectPlayerIsHost;
  readonly allPlayerIds = this.state.selectPlayerIds;

  readonly editablePlayerIds = computed((): Player['id'][] =>
    this.playerIsHost() ? this.allPlayerIds() : [this.playerId() ?? '_'],
  );

  readonly navigationConfirmation: Confirmation = {
    message:
      "Leave this game?  If you want to return, you'll need to join as a new player.",
    header: 'Leave Game',
    accept: () => {
      this.state.dispatch(this.state.actions.leaveGameConfirmed, undefined);
    },
    acceptButtonStyleClass: 'bg-red-400 border-none w-4rem ml-2',
    rejectButtonStyleClass: 'p-button-text w-4rem',
    acceptIcon: 'none',
    rejectIcon: 'none',
  };

  onStartGameButtonClick() {
    this.state.dispatch(this.state.actions.startGameButtonClicked, undefined);
  }

  onPlayerOrderChange(event: CdkDragDrop<string[]>): void {
    const playerIds = this.connectedAndSortedPlayers().map(
      (player) => player.id,
    );

    moveItemInArray(playerIds, event.previousIndex, event.currentIndex);

    this.state.dispatch(this.state.actions.playersReordered, { playerIds });
  }
}
