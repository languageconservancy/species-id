import { Component, OnInit } from '@angular/core';
import { IonMenu, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  imports: [IonMenu, IonHeader, IonToolbar, IonTitle, IonContent],
})
export class MenuComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
