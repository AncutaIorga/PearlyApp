import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile'; // <-- CAMBIA AQUÍ
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('ProfileComponent', () => { // <-- CAMBIA AQUÍ
  let component: ProfileComponent; // <-- CAMBIA AQUÍ
  let fixture: ComponentFixture<ProfileComponent>; // <-- CAMBIA AQUÍ

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent], // <-- CAMBIA AQUÍ
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]) // Esto soluciona el error de ActivatedRoute
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent); // <-- CAMBIA AQUÍ
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});