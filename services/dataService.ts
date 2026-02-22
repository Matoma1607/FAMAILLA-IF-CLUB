
import { Socio, Pago, Entrenamiento, Asistencia, Foto, FechaLiga } from '../types';

export const GAS_URL = 'https://script.google.com/macros/s/AKfycbwsBsbQP6ylO8BJ7QIV70iI-BB2-fi4eZ63uGr78KDUgueo_HwWeJLkuNJ51JvU_GFJ/exec';

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
      const response = await fetch(`${GAS_URL}?action=${action}&userToken=${emailParam}&t=${Date.now()}`);
      
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
  const id = socio.id || `S-${Date.now()}`;
  const payload = { ...socio, id };
  const res = await request('guardarSocio', payload);
  return { ...res, id };
};

export const deleteSocio = async (id: string) => {
  return await request('eliminarFila', { sheet: 'Socios', id });
};

export const getPagos = async (): Promise<Pago[]> => {
  const res = await request('obtenerPagos');
  return Array.isArray(res) ? res : [];
};

export const registrarPago = async (pago: any) => {
  const id = pago.id || `P-${Date.now()}`;
  const payload = { ...pago, id };
  const res = await request('guardarPago', payload);
  return { ...res, id };
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

export const deleteAsistencia = async (id: string) => {
  return await request('eliminarFila', { sheet: 'Asistencia', id });
};

// Added Photo service functions to support Galeria view
export const getFotos = async (): Promise<Foto[]> => {
  const res = await request('obtenerFotos');
  return Array.isArray(res) ? res : [];
};

export const saveFoto = async (foto: any) => {
  const payload = { ...foto, id: foto.id || `F-${Date.now()}`, fecha: new Date().toISOString() };
  return await request('guardarFoto', payload);
};

export const deleteFoto = async (id: string) => {
  return await request('eliminarFila', { sheet: 'Fotos', id });
};

export const getFechasLiga = async (): Promise<FechaLiga[]> => {
  const res = await request('obtenerFechasLiga');
  return Array.isArray(res) ? res : [];
};

export const saveFechaLiga = async (fecha: any) => {
  const payload = { ...fecha, id: fecha.id || `L-${Date.now()}` };
  return await request('guardarFechaLiga', payload);
};

export const deleteFechaLiga = async (id: string) => {
  return await request('eliminarFila', { sheet: 'FechasLiga', id });
};
