
import { Socio, Pago, Entrenamiento, Asistencia } from '../types';

export const GAS_URL = 'https://script.google.com/macros/s/AKfycbwcs0yBT6WWfvN4dB6nmhVbLi8iVsXIdrHg1ZsJl9joqbHEqg8Oq9hFWjXxI_t5WLuR/exec';

const getUserToken = () => {
  const session = localStorage.getItem('peques_session');
  return session ? JSON.parse(session).email : null;
};

const request = async (action: string, data?: any) => {
  const userToken = getUserToken();
  const url = new URL(GAS_URL);
  
  try {
    if (action.startsWith('obtener') || action === 'validarUsuario') {
      const emailParam = action === 'validarUsuario' ? data?.email : userToken;
      const response = await fetch(`${GAS_URL}?action=${action}&userToken=${emailParam}`);
      if (!response.ok) return null;
      return await response.json();
    } else {
      // POST requires careful handling with GAS (it doesn't support CORS OPTIONS preflight well)
      // We use a simple fetch without custom headers to avoid preflight
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
      
      // Since GAS returns 302/200 but opaque in some configurations, 
      // we check if we got a valid response or just assume success if it didn't throw
      return { success: true };
    }
  } catch (error) {
    console.error(`Error GAS [${action}]:`, error);
    // Fallback for demo purposes if script is not reachable
    return null;
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

export const generarMensualidades = async () => {
  return await request('generarMensualidades');
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
