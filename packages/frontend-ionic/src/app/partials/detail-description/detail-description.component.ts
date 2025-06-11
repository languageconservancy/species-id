import { Component, Input, OnInit } from '@angular/core';
import { Species } from 'app/models/species.model';
import { IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-detail-description',
  templateUrl: './detail-description.component.html',
  styleUrls: ['./detail-description.component.scss'],
  standalone: true,
  imports: [IonLabel],
})
export class DetailDescriptionComponent implements OnInit {
  @Input() species: Species | null = null;
  constructor() {}

  ngOnInit() {}
}
