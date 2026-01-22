
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard.tsx';
import Socios from './views/Socios.tsx';
import Pagos from './views/Pagos.tsx';
import Entrenamientos from './views/Entrenamientos.tsx';
import AsistenciaView from './views/Asistencia.tsx';
import { GAS_URL } from './services/dataService.ts';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CalendarDays, 
  Menu, 
  LogOut,
  ChevronRight,
  ClipboardCheck,
  ShieldCheck,
  Loader2
} from 'lucide-react';

const SidebarItem: React.FC<{ to: string, icon: React.ElementType, label: string, active: boolean }> = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
        : 'text-slate-300 hover:bg-white/5'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </Link>
);

const Login: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    if (email === 'admin@club.com') {
      const userData = { email, rol: 'owner' };
      localStorage.setItem('peques_session', JSON.stringify(userData));
      onLogin(userData);
      return;
    }

    if (email === 'profes@club.com') {
      const userData = { email, rol: 'staff' };
      localStorage.setItem('peques_session', JSON.stringify(userData));
      onLogin(userData);
      return;
    }

    try {
      const res = await fetch(`${GAS_URL}?action=validarUsuario&userToken=${email}`);
      const data = await res.json();
      if (data.autorizado) {
        const userData = { email, rol: data.rol };
        localStorage.setItem('peques_session', JSON.stringify(userData));
        onLogin(userData);
      } else {
        setError(data.error || 'No autorizado para acceder.');
      }
    } catch (err) {
      setError('Error de conexión. Intente con profes@club.com');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-fade-in text-center">
        <div className="flex justify-center mb-8">
           <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl">F</div>
        </div>
        <h3 className="text-2xl font-black mb-2 tracking-tight text-secondary">FAMAILLA IF</h3>
        <p className="text-slate-400 text-sm mb-8 font-bold uppercase tracking-widest italic">Manager Pro</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="text-left">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1 block tracking-widest">Acceso Personal</label>
            <input 
              type="email" 
              required
              placeholder="email@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-accent/30 focus:border-primary transition-all"
            />
          </div>
          {error && <p className="text-rose-500 text-xs font-bold text-center bg-rose-50 p-3 rounded-xl">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-[#7a5329] transition-all flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>INGRESAR AL PANEL</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

const AppLayout: React.FC<{ user: any, onLogout: () => void, children: React.ReactNode }> = ({ user, onLogout, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const isOwner = user?.rol === 'owner';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={toggleSidebar} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-secondary border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6 text-white">
          <div className="flex items-center space-x-3 mb-10 px-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">F</div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">FAMAILLA IF</h1>
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">CLUB OFICIAL</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {isOwner && <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />}
            <SidebarItem to="/socios" icon={Users} label="Alumnos" active={location.pathname === '/socios'} />
            <SidebarItem to="/asistencia" icon={ClipboardCheck} label="Asistencia" active={location.pathname === '/asistencia'} />
            {isOwner && <SidebarItem to="/pagos" icon={CreditCard} label="Finanzas" active={location.pathname === '/pagos'} />}
            <SidebarItem to="/entrenamientos" icon={CalendarDays} label="Diario Técnico" active={location.pathname === '/entrenamientos'} />
          </nav>

          <div className="pt-6 border-t border-white/10">
            <button onClick={onLogout} className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <LogOut size={20} />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button onClick={toggleSidebar} className="p-2 lg:hidden text-secondary hover:bg-slate-100 rounded-lg"><Menu size={24} /></button>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-secondary">{user?.email}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">{user?.rol === 'owner' ? 'Director Deportivo' : 'Profesor'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-white shadow-sm flex items-center justify-center text-secondary">
              <ShieldCheck size={20} />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 no-scrollbar">{children}</div>
      </main>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('peques_session');
    if (session) setUser(JSON.parse(session));
    setInitializing(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('peques_session');
    setUser(null);
  };

  if (initializing) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" /></div>;

  if (!user) return <Login onLogin={setUser} />;

  return (
    <HashRouter>
      <AppLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={user.rol === 'owner' ? <Dashboard /> : <Navigate to="/asistencia" />} />
          <Route path="/socios" element={<Socios />} />
          <Route path="/asistencia" element={<AsistenciaView />} />
          <Route path="/pagos" element={user.rol === 'owner' ? <Pagos /> : <Navigate to="/asistencia" />} />
          <Route path="/entrenamientos" element={<Entrenamientos />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
};

export default App;
