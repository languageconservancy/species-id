import { Component, Input, OnInit } from '@angular/core';
import { IonHeader, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar],
})
export class HeaderComponent implements OnInit {
  @Input() title = '';

  constructor() {}

  ngOnInit() {}
}
