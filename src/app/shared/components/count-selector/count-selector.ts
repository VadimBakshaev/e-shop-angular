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

  protected countChange(): void {
    this.onCountChange.emit(+this.count);
  }

  protected decreaseCount(): void {
    if (this.count > 1) {
      this.count--;
      this.countChange();
    }
  }

  protected increaseCount(): void {
    this.count++;
    this.countChange();
  }
}
