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
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
        min-width: 0;
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
  /** Sticky dividers break under CDK virtual scroll transforms; disable there. */
  @Input() sticky = true;

  constructor() {}

  ngOnInit() {}
}
