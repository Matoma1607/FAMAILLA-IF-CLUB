
export enum Category {
  CHUPETONES = 'CHUPETONES',
  CEBOLLITAS = 'CEBOLLITAS',
  INFANTILES = 'INFANTILES',
  INFERIORES = 'INFERIORES'
}

export type EventType = 'Entrenamiento' | 'Partido' | 'Evento Especial';

export interface Socio {
  id: string;
  nombre: string;
  apellido: string;
  categoria: Category;
  nombreTutor: string;
  telefonoTutor: string;
  activo: boolean;
  fechaInscripcion: string;
  fechaNacimiento?: string;
}

export interface Pago {
  id: string;
  socioId: string;
  mes: string;
  anio: number;
  monto: number;
  estado: 'PAGADO' | 'PENDIENTE';
  metodo?: 'EFECTIVO' | 'TRANSFERENCIA';
  nombreSocio?: string;
  nota?: string;
}

export interface Entrenamiento {
  id: string;
  categoria: Category;
  tipo: EventType;
  dia: string;
  fecha?: string;
  hora: string;
  lugar: string;
  profesor: string;
  plan: string;
}

export interface Asistencia {
  id: string;
  socioId: string;
  nombreSocio?: string;
  fecha: string;
  presente: boolean;
  categoria: string;
}

export interface FechaLiga {
  id: string;
  rival: string;
  fecha: string;
  hora: string;
  lugar: string;
  categoria: string;
  condicion: 'LOCAL' | 'VISITANTE';
}

// Added Foto interface for the gallery view
export interface Foto {
  id: string;
  url: string;
  descripcion: string;
  fecha: string;
}
