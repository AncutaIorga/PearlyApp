export interface Soporte {
  id?: number;
  idUsuario: number;
  asunto: string;
  descripcion: string;
  estado: string;
  respuesta?: string;
  fechaApertura: string;
  fechaRespuesta?: string;
}