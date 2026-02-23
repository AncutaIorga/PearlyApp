import { TestBed } from '@angular/core/testing';
import { PostService } from './post'; // Asegúrate de que el archivo se llame post.ts y la clase PostService

describe('PostService', () => {
  let service: PostService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PostService]
    });
    service = TestBed.inject(PostService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});