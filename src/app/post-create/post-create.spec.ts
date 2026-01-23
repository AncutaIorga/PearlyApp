import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostCreateComponent } from './post-create';

describe('PostCreate', () => {
  let component: PostCreateComponent;
  let fixture: ComponentFixture<PostCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
