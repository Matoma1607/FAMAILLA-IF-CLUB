
import { Socio, Pago, Entrenamiento, Asistencia } from '../types';

export const GAS_URL = 'https://script.google.com/macros/s/AKfycbwVREPvlhBRfq0Q2kduIgGO0PoLkpNPV47-k9xZhaigUNiGU8zr1q1glak26McwLBG3/exec';

const getUserToken = () => {
  const session = localStorage.getItem('peques_session');
  return session ? JSON.parse(session).email : null;
};

const request = async (action: string, data?: any) => {
  const userToken = getUserToken();
  if (!userToken && action !== 'validarUsuario') {
    throw new Error("Sesión expirada. Por favor, vuelve a ingresar.");
  }

  try {
    if (action.startsWith('obtener') || action === 'validarUsuario') {
      const emailParam = action === 'validarUsuario' ? data?.email : userToken;
      const response = await fetch(`${GAS_URL}?action=${action}&userToken=${emailParam}`);
      
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.error || `Error del servidor (${response.status})`);
      }
      return responseData;
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
      
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.error || `Error al guardar (${response.status})`);
      }
      
      return responseData;
    }
  } catch (error: any) {
    console.error(`Error GAS [${action}]:`, error.message);
    throw error;
  }
};

export const getSocios = async (): Promise<Socio[]> => {
  const res = await request('obtenerSocios');
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
