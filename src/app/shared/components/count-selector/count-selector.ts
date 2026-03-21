import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'count-selector',
  standalone: false,
  templateUrl: './count-selector.html',
  styleUrl: './count-selector.scss',
})
export class CountSelectorComponent {
  @Input() count: number = 1;
  @Output() onCountChange: EventEmitter<number> = new EventEmitter<number>();

  protected countChange() {    
    this.onCountChange.emit(+this.count);
  }

  protected decreaseCount() {
    if (this.count > 1) {
      this.count--;
      this.countChange();
    }
  }

  protected increaseCount() {
    this.count++;
    this.countChange();
  }
}
