export interface Usuario {
  idUsuario?: number;
  nombre: string;
  email: string;
  password?: string; 
  fechaNacimiento?: string;
}