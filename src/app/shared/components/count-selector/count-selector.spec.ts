import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountSelector } from './count-selector';

describe('CountSelector', () => {
  let component: CountSelector;
  let fixture: ComponentFixture<CountSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CountSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
