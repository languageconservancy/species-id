import { Component, Input } from '@angular/core';
import { IonList } from '@ionic/angular/standalone';

@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
  imports: [IonList],
  standalone: true,
})
export class ExploreContainerComponent {
  @Input() name?: string;
}
