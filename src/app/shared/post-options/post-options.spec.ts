import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostOptionsComponent } from './post-options';

describe('PostOptionsComponent', () => {
  let component: PostOptionsComponent;
  let fixture: ComponentFixture<PostOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostOptionsComponent]  // si es standalone
    }).compileComponents();

    fixture = TestBed.createComponent(PostOptionsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
