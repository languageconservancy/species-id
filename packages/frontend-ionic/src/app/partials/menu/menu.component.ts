import { Component, OnInit } from '@angular/core';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { leaf, search, settings, informationCircle } from 'ionicons/icons';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  imports: [
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
  ],
})
export class MenuComponent implements OnInit {
  constructor() {
    // Add icons to the menu
    addIcons({
      leaf,
      search,
      settings,
      informationCircle,
    });
  }

  ngOnInit() {}
}
