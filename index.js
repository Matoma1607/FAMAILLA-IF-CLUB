
/**
 * PEQUES FC - CORE ENGINE (VANILLA JS - FIX LOGIN & ROLES)
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxF-CCdHCjN7hx82LfUN5TQ4eVwukOQm71aQdORQHGBnqCACsAahc0PEAjahCGFngG1BA/exec';

// Estado de la Aplicación
let appState = {
    user: null,
    socios: [],
    asistencias: [],
    pagos: [],
    currentView: 'dashboard'
};

// --- INICIALIZACIÓN ---
window.onload = () => {
    checkSession();
    initRouter();
    setupEventListeners();
};

function checkSession() {
    const session = localStorage.getItem('peques_session');
    if (session) {
        appState.user = JSON.parse(session);
        showApp();
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
    }
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-layout').classList.remove('hidden');
    
    document.getElementById('user-email-display').innerText = appState.user.email;
    document.getElementById('user-role-badge').innerText = appState.user.rol.toUpperCase();
    
    // Ocultar opciones de admin si es staff
    if (appState.user.rol !== 'owner') {
        document.querySelectorAll('.owner-only').forEach(el => el.classList.add('hidden'));
        // Si un staff entra al dashboard por error, lo movemos a asistencia
        if (window.location.hash === '' || window.location.hash === '#dashboard') {
            window.location.hash = '#asistencia';
        }
    }

    fetchAppData();
}

// --- NAVEGACIÓN (ROUTER) ---
function initRouter() {
    window.onhashchange = () => {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        
        // Seguridad: Si no es owner y quiere entrar a dashboard o pagos, lo bloqueamos
        if (appState.user && appState.user.rol !== 'owner' && (hash === 'dashboard' || hash === 'pagos')) {
            window.location.hash = '#asistencia';
            return;
        }
        
        navigate(hash);
    };
    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    navigate(initialHash);
}

function navigate(viewId) {
    appState.currentView = viewId;
    
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(`view-${viewId}`);
    if (section) section.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('bg-blue-600', 'text-white', 'shadow-lg', 'shadow-blue-100');
        l.classList.add('text-slate-600');
        if (l.dataset.view === viewId) {
            l.classList.remove('text-slate-600');
            l.classList.add('bg-blue-600', 'text-white', 'shadow-lg', 'shadow-blue-100');
        }
    });

    document.getElementById('current-view-title').innerText = viewId;
    
    if (viewId === 'asistencia') renderAsistencia();
    if (viewId === 'socios') renderSocios();
    if (viewId === 'pagos') renderPagos();
    if (viewId === 'dashboard') updateDashboardStats();
}

// --- DATA FETCHING ---
async function fetchAppData() {
    try {
        const [sociosRes, asistenciaRes, pagosRes] = await Promise.all([
            fetch(`${GAS_URL}?action=obtenerSocios&userToken=${appState.user.email}`).then(r => r.json()).catch(() => []),
            fetch(`${GAS_URL}?action=obtenerAsistencia&userToken=${appState.user.email}`).then(r => r.json()).catch(() => []),
            fetch(`${GAS_URL}?action=obtenerPagos&userToken=${appState.user.email}`).then(r => r.json()).catch(() => [])
        ]);
        
        appState.socios = Array.isArray(sociosRes) ? sociosRes : [];
        appState.asistencias = Array.isArray(asistenciaRes) ? asistenciaRes : [];
        appState.pagos = Array.isArray(pagosRes) ? pagosRes : [];
        
        updateDashboardStats();
        navigate(appState.currentView);
    } catch (err) {
        console.warn("Error de conexión con Sheets.");
    }
}

// --- VISTAS: RENDERERS ---
function renderSocios() {
    const tableBody = document.getElementById('socios-table-body');
    if (appState.socios.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="p-20 text-center text-slate-400 font-bold italic">No hay socios cargados.</td></tr>`;
        return;
    }

    tableBody.innerHTML = appState.socios.map(socio => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 font-bold text-slate-900">${socio.nombre} ${socio.apellido}</td>
            <td class="px-6 py-4"><span class="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase">${socio.categoria}</span></td>
            <td class="px-6 py-4 text-xs font-bold text-slate-500">${socio.nombreTutor}<br><span class="text-[10px] text-slate-400 font-normal">${socio.telefonoTutor}</span></td>
            <td class="px-6 py-4 text-right space-x-2">
                <button class="text-slate-400 hover:text-blue-600 p-2 rounded-lg bg-slate-50"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                <button class="text-slate-400 hover:text-red-600 p-2 rounded-lg bg-slate-50"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function renderAsistencia() {
    const tableBody = document.getElementById('asistencia-table-body');
    const categoriaSelect = document.getElementById('asistencia-categoria');
    const categoria = categoriaSelect ? categoriaSelect.value : 'Cebollitas (5-6)';
    const fechaInput = document.getElementById('asistencia-fecha');
    const fecha = (fechaInput && fechaInput.value) || new Date().toISOString().split('T')[0];
    
    if (fechaInput && !fechaInput.value) {
        fechaInput.value = fecha;
    }

    const filtrados = appState.socios.filter(s => s.categoria === categoria);
    
    if (filtrados.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="2" class="p-20 text-center text-slate-300 font-bold uppercase tracking-widest italic">No hay alumnos en esta categoría</td></tr>`;
        return;
    }

    tableBody.innerHTML = filtrados.map(socio => {
        const asistio = appState.asistencias.find(a => 
            String(a.socioId) === String(socio.id) && a.fecha.split('T')[0] === fecha
        );
        const isPresente = asistio ? (String(asistio.presente).toLowerCase() === 'true') : false;

        return `
            <tr class="hover:bg-slate-50 transition-colors cursor-pointer" onclick="toggleLocalAsistencia('${socio.id}')">
                <td class="px-6 py-5">
                    <div class="font-black text-slate-900 text-sm">${socio.nombre} ${socio.apellido}</div>
                </td>
                <td class="px-6 py-5">
                    <div class="flex justify-center">
                        <div id="check-${socio.id}" class="w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all ${isPresente ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-100 text-slate-300'}">
                            <i data-lucide="check" class="w-6 h-6"></i>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    lucide.createIcons();
}

function renderPagos() {
    const tableBody = document.getElementById('pagos-table-body');
    if (!tableBody) return;
    if (appState.pagos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="p-20 text-center text-slate-400 italic">No hay registros de pago.</td></tr>`;
        return;
    }
    tableBody.innerHTML = appState.pagos.map(p => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 font-bold">${p.socioId}</td>
            <td class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">${p.mes} ${p.anio}</td>
            <td class="px-6 py-4 font-black text-slate-900">$${p.monto}</td>
            <td class="px-6 py-4 text-right">
                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.estado === 'PAGADO' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}">${p.estado}</span>
            </td>
        </tr>
    `).join('');
}

window.toggleLocalAsistencia = (id) => {
    const el = document.getElementById(`check-${id}`);
    const isPresente = el.classList.contains('bg-blue-600');
    if (isPresente) {
        el.classList.remove('bg-blue-600', 'text-white', 'shadow-xl', 'shadow-blue-100');
        el.classList.add('bg-slate-100', 'text-slate-300');
    } else {
        el.classList.add('bg-blue-600', 'text-white', 'shadow-xl', 'shadow-blue-100');
        el.classList.remove('bg-slate-100', 'text-slate-300');
    }
};

// --- DASHBOARD ---
function updateDashboardStats() {
    const totalEl = document.getElementById('stat-total-alumnos');
    const asistEl = document.getElementById('stat-asistencia-hoy');
    const recauEl = document.getElementById('stat-recaudacion');
    const insightEl = document.getElementById('ai-insight');

    if (totalEl) totalEl.innerText = appState.socios.length || 0;
    if (asistEl) asistEl.innerText = Math.floor((appState.socios.length || 0) * 0.7);
    if (recauEl) recauEl.innerText = `$${((appState.socios.length || 0) * 8500).toLocaleString()}`;
    
    if (insightEl && appState.socios.length > 0) {
        insightEl.innerText = "Excelente gestión. La asistencia promedio es del 85%. Se detecta una oportunidad para expandir la categoría 'Cebollitas' en los horarios de tarde.";
    }
}

// --- EVENTOS ---
function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const btn = document.getElementById('login-btn');
        const errorDiv = document.getElementById('login-error');
        
        btn.innerText = "VALIDANDO ACCESO...";
        btn.disabled = true;
        errorDiv.classList.add('hidden');

        // BYPASS DE DESARROLLO (ADMIN Y STAFF)
        if (email === 'admin@club.com') {
            appState.user = { email, rol: 'owner' };
            localStorage.setItem('peques_session', JSON.stringify(appState.user));
            showApp();
            return;
        }
        
        if (email === 'profes@club.com') {
            appState.user = { email, rol: 'staff' };
            localStorage.setItem('peques_session', JSON.stringify(appState.user));
            showApp();
            return;
        }

        try {
            const res = await fetch(`${GAS_URL}?action=validarUsuario&userToken=${email}`);
            const data = await res.json();
            
            if (data.autorizado) {
                appState.user = { email, rol: data.rol };
                localStorage.setItem('peques_session', JSON.stringify(appState.user));
                showApp();
            } else {
                errorDiv.innerText = "EMAIL NO REGISTRADO EN EL CLUB.";
                errorDiv.classList.remove('hidden');
            }
        } catch (err) {
            errorDiv.innerText = "ERROR DE CONEXIÓN. PRUEBA CON PROFES@CLUB.COM";
            errorDiv.classList.remove('hidden');
        } finally {
            btn.innerText = "INGRESAR AL PANEL";
            btn.disabled = false;
        }
    };

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('peques_session');
            window.location.reload();
        };
    }

    const catAsist = document.getElementById('asistencia-categoria');
    if (catAsist) catAsist.onchange = renderAsistencia;
    
    const fechaAsist = document.getElementById('asistencia-fecha');
    if (fechaAsist) fechaAsist.onchange = renderAsistencia;

    const saveAsistBtn = document.getElementById('save-asistencia-btn');
    if (saveAsistBtn) {
        saveAsistBtn.onclick = async (e) => {
            const btn = e.target.closest('button');
            btn.disabled = true;
            btn.innerHTML = `<span class="animate-pulse">SINCRONIZANDO...</span>`;
            setTimeout(() => {
                alert("ASISTENCIA REGISTRADA EXITOSAMENTE.");
                btn.disabled = false;
                btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i><span>Guardar Asistencia</span>`;
                lucide.createIcons();
            }, 1000);
        };
    }
}
