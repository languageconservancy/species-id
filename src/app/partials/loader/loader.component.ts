import { Component } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import { LoaderService } from 'app/services/loader.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  standalone: true,
  imports: [IonSpinner],
})
export class LoaderComponent {
  constructor(readonly loader: LoaderService) {}
}
