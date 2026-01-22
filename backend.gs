
/**
 * SISTEMA DE GESTIÓN FAMAILLA IF - BACKEND PRO
 */

const SPREADSHEET_ID = '1hU-LIr6OmIBiuqhHlRDMfCRCPuSmWE7zHf9dcCE1RIY';

function getSS() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Definición de permisos por Rol
const PERMISOS = {
  'staff': [
    'obtenerSocios', 
    'obtenerAsistencia', 
    'obtenerEntrenamientos', 
    'guardarAsistencia', 
    'guardarEntrenamiento',
    'validarUsuario'
  ],
  'owner': '*' 
};

function validarPermiso(email, action) {
  const users = obtenerDatos('Usuarios');
  const user = users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase());
  
  if (!user) return { autorizado: false, error: 'Usuario no registrado' };
  
  const rol = String(user.rol).toLowerCase();
  if (PERMISOS[rol] === '*') return { autorizado: true, rol: rol };
  if (PERMISOS[rol] && PERMISOS[rol].includes(action)) return { autorizado: true, rol: rol };
  
  return { autorizado: false, error: 'Acceso Denegado (403)' };
}

function doGet(e) {
  const action = e.parameter.action;
  const email = e.parameter.userToken;
  try {
    if (action === 'validarUsuario') return jsonResponse(validarPermiso(email, action));
    const auth = validarPermiso(email, action);
    if (!auth.autorizado) return jsonResponse({ error: auth.error }, 403);
    if (action === 'obtenerSocios') return jsonResponse(obtenerDatos('Socios'));
    if (action === 'obtenerPagos') return jsonResponse(obtenerDatos('Pagos'));
    if (action === 'obtenerAsistencia') return jsonResponse(obtenerDatos('Asistencia'));
    if (action === 'obtenerEntrenamientos') return jsonResponse(obtenerDatos('Entrenamientos'));
    return jsonResponse({ error: 'Acción no válida' });
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    const auth = validarPermiso(contents.userToken, action);
    if (!auth.autorizado) return jsonResponse({ error: auth.error }, 403);
    const data = contents.data;
    if (action === 'guardarSocio') guardarSocio(data);
    else if (action === 'guardarEntrenamiento') guardarEntrenamiento(data);
    else if (action === 'guardarPago') guardarPago(data);
    else if (action === 'guardarAsistencia') guardarAsistenciaBatch(data);
    else if (action === 'actualizarEstadoPago') actualizarEstadoPago(contents.id, contents.estado);
    else if (action === 'eliminarFila') eliminarFila(contents.sheet, contents.id);
    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

function jsonResponse(obj, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = getSS();
  let sheet = ss.getSheetByName(name);
  const headersMap = {
    'Socios': ['id', 'nombre', 'apellido', 'categoria', 'nombreTutor', 'telefonoTutor', 'activo'],
    'Pagos': ['id', 'socioId', 'mes', 'anio', 'monto', 'estado'],
    'Asistencia': ['id', 'socioId', 'fecha', 'categoria', 'presente'],
    'Entrenamientos': ['id', 'categoria', 'dia', 'hora', 'lugar', 'plan', 'profesor', 'tipo'],
    'Usuarios': ['id', 'email', 'rol', 'nombre']
  };
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headersMap[name]);
    if (name === 'Usuarios') sheet.appendRow([Utilities.getUuid(), 'admin@club.com', 'owner', 'Administrador']);
  }
  return sheet;
}

function obtenerDatos(name) {
  const sheet = getSheet(name);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values.shift();
  return values.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = (row[i] !== undefined) ? row[i] : ""; 
      obj[h] = (val instanceof Date) ? val.toISOString() : val;
    });
    return obj;
  });
}

function guardarSocio(data) {
  const sheet = getSheet('Socios');
  const values = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == data.id) { rowIdx = i + 1; break; }
  }
  const row = [data.id, data.nombre, data.apellido, data.categoria, data.nombreTutor, data.telefonoTutor, data.activo];
  if (rowIdx > 0) sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
}

function guardarPago(data) {
  const sheet = getSheet('Pagos');
  sheet.appendRow([data.id, data.socioId, data.mes, data.anio, data.monto, 'PAGADO']);
}

function guardarEntrenamiento(data) {
  const sheet = getSheet('Entrenamientos');
  sheet.appendRow([data.id, data.categoria, data.dia, data.hora, data.lugar, data.plan || "", data.profesor || "", data.tipo]);
}

function guardarAsistenciaBatch(batch) {
  const sheet = getSheet('Asistencia');
  batch.forEach(item => {
    sheet.appendRow([Utilities.getUuid(), item.socioId, item.fecha, item.categoria, item.presente]);
  });
}

function actualizarEstadoPago(id, estado) {
  const sheet = getSheet('Pagos');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == id) { sheet.getRange(i + 1, 6).setValue(estado); break; }
  }
}

function eliminarFila(sheetName, id) {
  const sheet = getSS().getSheetByName(sheetName);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); break; }
  }
}
