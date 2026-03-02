import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostCardComponent } from './post-card';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('PostCardComponent', () => {
  let component: PostCardComponent;
  let fixture: ComponentFixture<PostCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PostCardComponent);
    component = fixture.componentInstance;
    
    // Objeto Mock con tipos corregidos según tus errores de TS
    component.post = { 
      id: 1, 
      idUsuario: 1,
      user: 'Usuario Test', 
      text: 'Texto de prueba para la excelencia', 
      image: 'https://picsum.photos/400', 
      userAvatar: 'https://picsum.photos/100',
      likes: 0, 
      likedBy: [],
      comments: [],
      createdAt: new Date()
    };
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});