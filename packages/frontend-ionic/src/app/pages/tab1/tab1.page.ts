import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { search, options } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';
import { SpeciesType } from 'app/models/species.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle],
})
export class Tab1Page implements OnInit {
  public domain: SpeciesType = SpeciesType.Bird;
  public speciesType = SpeciesType;

  constructor(private route: ActivatedRoute) {
    addIcons({ search, options });
  }

  async ngOnInit() {
    console.log('Tab1Page ngOnInit');
    this._setDomain();
  }

  private _setDomain() {
    this.domain = (this.route.snapshot.params['domain'] as SpeciesType) ?? SpeciesType.Bird;
    console.log('Domain: ', this.domain);
  }
}
