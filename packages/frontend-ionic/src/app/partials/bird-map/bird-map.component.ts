import { Component, OnInit, Input } from '@angular/core';
import { Species } from 'app/models/species.model';

@Component({
  selector: 'app-bird-map',
  templateUrl: './bird-map.component.html',
  styleUrls: ['./bird-map.component.scss'],
})
export class BirdMapComponent implements OnInit {
  @Input() species!: Species;

  constructor() {}

  ngOnInit() {}
}
