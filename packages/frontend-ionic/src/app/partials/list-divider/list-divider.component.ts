import { Component, Input, OnInit } from '@angular/core';
import { IonItemDivider, IonLabel } from '@ionic/angular/standalone';
import { SpeciesGroup } from 'app/models/species.model';

@Component({
  selector: 'app-list-divider',
  templateUrl: './list-divider.component.html',
  standalone: true,
  imports: [IonItemDivider, IonLabel],
})
export class ListDividerComponent implements OnInit {
  @Input() itemGroup!: SpeciesGroup;

  constructor() {}

  ngOnInit() {}
}
