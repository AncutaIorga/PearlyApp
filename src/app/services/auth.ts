import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

interface User {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;
  user = signal<{ name: string; email: string } | null>(null);
  
  // Simulación de base de datos temporal (se perderá al recargar)
  // Cuando tengas el backend, esto se reemplazará por llamadas HTTP
  private registeredUsers: User[] = [
    {
      name: 'Neli',
      email: 'neli@gmail.com',
      password: 'Neli404_'
    }
  ];

  constructor(private router: Router) {
    // Verifica si ya hay sesión guardada
    this.isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
    
    if (this.isAuthenticated) {
      const userName = localStorage.getItem('userName') || '';
      const userEmail = localStorage.getItem('userEmail') || '';
      this.user.set({ name: userName, email: userEmail });
    }
  }

  // Validación de email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validación de contraseña: mínimo 1 mayúscula, 1 minúscula, 1 número y 1 símbolo
  private isValidPassword(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSymbol && password.length >= 8;
  }

  // Obtener mensaje detallado de error de contraseña
  private getPasswordError(password: string): string {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('una minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('un número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/.test(password)) {
      errors.push('un símbolo (!@#$%^&*_-...)');
    }
    
    return `La contraseña debe contener: ${errors.join(', ')}`;
  }

  login(email: string, password: string): boolean {
    // Validar que el email no esté vacío
    if (!email || !password) {
      alert('Por favor completa todos los campos');
      return false;
    }

    // Validar formato de email
    if (!this.isValidEmail(email)) {
      alert('Por favor ingresa un email válido (ejemplo: usuario@gmail.com)');
      return false;
    }

    // Buscar usuario en la "base de datos"
    const user = this.registeredUsers.find(
      u => u.email === email && u.password === password
    );

    if (user) {
      this.isAuthenticated = true;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      this.user.set({ name: user.name, email: user.email });
      this.router.navigate(['/feed']);
      return true;
    } else {
      alert('Email o contraseña incorrectos');
      return false;
    }
  }

  register(name: string, email: string, password: string): boolean {
    // Validar campos vacíos
    if (!name || !email || !password) {
      alert('Por favor completa todos los campos');
      return false;
    }

    // Validar nombre (mínimo 2 caracteres)
    if (name.trim().length < 2) {
      alert('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    // Validar formato de email
    if (!this.isValidEmail(email)) {
      alert('Por favor ingresa un email válido (ejemplo: usuario@gmail.com)');
      return false;
    }

    // Validar contraseña
    if (!this.isValidPassword(password)) {
      alert(this.getPasswordError(password));
      return false;
    }

    // Verificar si el email ya está registrado
    const emailExists = this.registeredUsers.some(u => u.email === email);
    if (emailExists) {
      alert('Este email ya está registrado');
      return false;
    }

    // Registrar nuevo usuario
    const newUser: User = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password
    };

    this.registeredUsers.push(newUser);

    // TODO: Cuando tengas el backend, reemplazar esto con:
    // return this.http.post('/api/register', newUser).subscribe(...)

    // Auto-login después del registro
    this.isAuthenticated = true;
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', newUser.name);
    localStorage.setItem('userEmail', newUser.email);
    this.user.set({ name: newUser.name, email: newUser.email });
    this.router.navigate(['/feed']);
    
    alert('¡Cuenta creada exitosamente!');
    return true;
  }

  logout() {
    this.isAuthenticated = false;
    this.user.set(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  // Método helper para debugging (eliminar en producción)
  getRegisteredUsers(): User[] {
    return this.registeredUsers;
  }
}