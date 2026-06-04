import { Component, Input, OnInit } from '@angular/core';
import { IonItemDivider, IonLabel } from '@ionic/angular/standalone';
import { SpeciesGroup } from 'app/models/species.model';

@Component({
  selector: 'app-list-divider',
  templateUrl: './list-divider.component.html',
  standalone: true,
  imports: [IonItemDivider, IonLabel],
  styles: [
    `
      /* Let ion-item-divider participate in ion-item-group layout (required for sticky). */
      :host {
        display: contents;
      }

      ion-item-divider {
        width: 100%;
        max-width: 100%;
      }
    `,
  ],
})
export class ListDividerComponent implements OnInit {
  @Input() itemGroup!: SpeciesGroup;
  /** Native sticky headers; set false only if a parent breaks position:sticky (e.g. transformed scroll). */
  @Input() sticky = true;

  constructor() {}

  ngOnInit() {}
}
