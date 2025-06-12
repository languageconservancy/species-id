import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Species } from 'app/models/species.model';
import { IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-detail-description',
  templateUrl: './detail-description.component.html',
  styleUrls: ['./detail-description.component.scss'],
  standalone: true,
  imports: [IonText],
})
export class DetailDescriptionComponent implements OnInit, OnChanges {
  @Input() species: Species | null = null;

  constructor() {}

  ngOnInit() {
    console.log('DetailDescriptionComponent ngOnInit', this.species?.nameLocal);
    console.log('Species object:', JSON.stringify(this.species, null, 2));
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('DetailDescriptionComponent ngOnChanges', changes);
    if (changes['species']) {
      console.log('Species changed:', this.species?.nameLocal);
      console.log('Species object:', JSON.stringify(this.species, null, 2));
    }
  }
}
