
export enum Category {
  CEBOLLITAS = 'Cebollitas (5-6)',
  PRE_DECIMA = 'Pre-Décima (7-8)',
  DECIMA = 'Décima (9-10)',
  INFANTIL = 'Infantil (11-12)'
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
}

export interface Pago {
  id: string;
  socioId: string;
  mes: string;
  anio: number;
  monto: number;
  estado: 'PAGADO' | 'PENDIENTE';
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
  fecha: string;
  presente: boolean;
  categoria: string;
}
