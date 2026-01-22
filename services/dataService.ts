
import { Socio, Pago, Entrenamiento, Asistencia } from '../types';

export const GAS_URL = 'https://script.google.com/macros/s/AKfycbzTRMh7S1kFH8Advp2HlVMXP3fG9AE8YQonNevTC29QI_NIny63RmjQWjW9slq89c-H/exec';

const getUserToken = () => {
  const session = localStorage.getItem('peques_session');
  return session ? JSON.parse(session).email : null;
};

const request = async (action: string, data?: any) => {
  const userToken = getUserToken();
  if (!userToken && action !== 'validarUsuario') {
    console.error("No hay sesión activa para realizar la acción:", action);
    return null;
  }

  try {
    if (action.startsWith('obtener') || action === 'validarUsuario') {
      const emailParam = action === 'validarUsuario' ? data?.email : userToken;
      const response = await fetch(`${GAS_URL}?action=${action}&userToken=${emailParam}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Error ${response.status} en ${action}:`, errorData.error || response.statusText);
        return null;
      }
      return await response.json();
    } else {
      const payload = { 
        action, 
        userToken,
        data,
        id: data?.id,
        estado: data?.estado,
        sheet: data?.sheet
      };
      
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return { success: true };
    }
  } catch (error) {
    console.error(`Error de red/GAS [${action}]:`, error);
    return null;
  }
};

export const getSocios = async (): Promise<Socio[]> => {
  const res = await request('obtenerSocios');
  if (!res) return [];
  return Array.isArray(res) ? res : [];
};

export const saveSocio = async (socio: any) => {
  const payload = { ...socio, id: socio.id || `S-${Date.now()}` };
  return await request('guardarSocio', payload);
};

export const deleteSocio = async (id: string) => {
  return await request('eliminarFila', { sheet: 'Socios', id });
};

export const getPagos = async (): Promise<Pago[]> => {
  const res = await request('obtenerPagos');
  return Array.isArray(res) ? res : [];
};

export const registrarPago = async (pago: any) => {
  const payload = { ...pago, id: pago.id || `P-${Date.now()}` };
  return await request('guardarPago', payload);
};

export const updateEstadoPago = async (id: string, estado: string) => {
  return await request('actualizarEstadoPago', { id, estado });
};

export const deletePago = async (id: string) => {
  return await request('eliminarFila', { sheet: 'Pagos', id });
};

export const getEntrenamientos = async (): Promise<Entrenamiento[]> => {
  const res = await request('obtenerEntrenamientos');
  return Array.isArray(res) ? res : [];
};

export const saveEntrenamiento = async (ent: any) => {
  const payload = { ...ent, id: ent.id || `E-${Date.now()}` };
  return await request('guardarEntrenamiento', payload);
};

export const deleteEntrenamiento = async (id: string) => {
  return await request('eliminarFila', { sheet: 'Entrenamientos', id });
};

export const getAsistencia = async (): Promise<Asistencia[]> => {
  const res = await request('obtenerAsistencia');
  return Array.isArray(res) ? res : [];
};

export const saveAsistencia = async (batch: any[]) => {
  return await request('guardarAsistencia', batch);
};
