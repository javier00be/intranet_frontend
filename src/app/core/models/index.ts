export type UserRole = 'director' | 'profesor' | 'padre' | 'estudiante';

export interface UsuarioInfo {
  id?: number;
  email?: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
  avatar?: string;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  avatar?: string;
}

export interface Estudiante {
  id: number;
  usuario: User;
  fechaNacimiento: Date;
  direccion: string;
  telefono: string;
  grado: number;
  seccion: string;
  nivel: 'inicial' | 'primaria' | 'secundaria';
}

export interface Profesor {
  id: number;
  usuario: User;
  especialidad: string;
  telefono: string;
  cursosAsignados: number[];
}

export interface Curso {
  id: number;
  nombre: string;
  descripcion: string;
  nivel: 'inicial' | 'primaria' | 'secundaria';
  grado: number;
  seccion: string;
  profesorId: number;
  año: number;
}

export interface Tarea {
  id: number;
  cursoId: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: Date;
  archivoUrl?: string;
}

export interface Matricula {
  id: number;
  estudianteId: number;
  cursoId: number;
  año: number;
  estado: 'activa' | 'inactiva' | 'finalizada';
}

export interface Calificacion {
  id: number;
  estudianteId: number;
  cursoId: number;
  tareaId?: number;
  valor: number;
  tipo: 'examen' | 'tarea' | 'participacion' | 'proyecto';
  fecha: Date;
  observaciones?: string;
  profesorId: number;
}

export interface Asistencia {
  id: number;
  estudianteId: number;
  cursoId: number;
  fecha: Date;
  presente: boolean;
  observaciones?: string;
}

export interface Horario {
  id: number;
  cursoId: number;
  dia: number;
  horaInicio: string;
  horaFin: string;
  salon: string;
}

export interface Pago {
  id: number;
  estudianteId: number;
  monto: number;
  concepto: string;
  fechaPago: Date;
  estado: 'pendiente' | 'pagado' | 'vencido';
  metodoPago?: string;
}

export interface NivelEducativo {
  id: string;
  nombre: string;
  grados: number[];
}