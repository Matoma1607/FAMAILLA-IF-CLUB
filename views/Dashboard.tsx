
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  BrainCircuit,
  Loader2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { getSocios, getPagos, GAS_URL } from '../services/dataService';
import { getClubInsights } from '../services/geminiService';
import { Link } from 'react-router-dom';
import { Socio, Pago } from '../types';

const StatCard = ({ title, value, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-secondary">{value}</h3>
  </div>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, activos: 0, deudores: 0, recaudacion: 0 });
  const [vencidos, setVencidos] = useState<Socio[]>([]);
  const [insights, setInsights] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();
  const mesActual = meses[now.getMonth()];
  const anioActual = now.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const socios = await getSocios();
        const pagos = await getPagos();
        
        // Calcular deudores del mes actual
        const listaDeudores = socios.filter(s => {
          const pago = pagos.find(p => 
            String(p.socioId) === String(s.id) && 
            p.mes === mesActual && 
            p.anio === anioActual &&
            p.estado === 'PAGADO'
          );
          return !pago;
        });

        const recaudacion = (pagos || []).filter(p => p.estado === 'PAGADO').reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);

        setStats({
          total: (socios || []).length,
          activos: (socios || []).filter(s => s.activo).length,
          deudores: listaDeudores.length,
          recaudacion: recaudacion
        });
        
        setVencidos(listaDeudores.slice(0, 5)); // Mostrar solo los primeros 5 en el dashboard

        if (socios && socios.length > 0) {
          setInsightsLoading(true);
          // La función ahora siempre devuelve un string
          const aiInsights = await getClubInsights({ 
            clubName: "Famaillá IF", 
            sociosCount: socios.length, 
            deudoresCount: listaDeudores.length, 
            recaudacion 
          });
          setInsights(aiInsights || "Análisis no disponible.");
          setInsightsLoading(false);
        }
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex flex-col items-center justify-center h-64 space-y-4"><Loader2 className="w-8 h-8 text-primary animate-spin" /><p className="text-slate-500 font-medium italic">Sincronizando con Famaillá IF Database...</p></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-secondary">Panel de Control</h2>
        <p className="text-slate-500">Resumen institucional de Famaillá IF - {mesActual} {anioActual}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Alumnos" value={stats.total} icon={Users} colorClass="bg-primary" trend="Sincronizado" />
        <StatCard title="Plantel Activo" value={stats.activos} icon={TrendingUp} colorClass="bg-secondary" />
        <StatCard title="Vencidos este mes" value={stats.deudores} icon={AlertCircle} colorClass="bg-rose-600" />
        <StatCard title="Caja Total" value={`$${stats.recaudacion.toLocaleString()}`} icon={DollarSign} colorClass="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-secondary mb-6">Alertas de Vencimiento</h3>
            {vencidos.length > 0 ? (
              <div className="space-y-3">
                {vencidos.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{s.nombre} {s.apellido}</p>
                        <p className="text-[10px] text-rose-600 font-bold uppercase">{s.categoria}</p>
                      </div>
                    </div>
                    <Link to="/pagos" className="p-2 text-rose-400 hover:text-rose-600 transition-colors">
                      <ChevronRight size={20} />
                    </Link>
                  </div>
                ))}
                <Link to="/socios" className="block text-center text-xs font-bold text-primary hover:underline pt-2 uppercase tracking-widest">
                  Ver todos los deudores
                </Link>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm italic">¡Excelente! No hay vencimientos pendientes este mes.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-2xl shadow-xl text-white">
          <div className="flex items-center space-x-2 mb-4">
            <BrainCircuit size={24} className="text-primary" />
            <h3 className="text-lg font-bold tracking-tight">AI Advisor</h3>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 min-h-[160px] border border-white/10">
            {insightsLoading ? (
              <div className="flex flex-col items-center justify-center h-32 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-accent italic">Analizando finanzas...</p>
              </div>
            ) : (
              <p className="text-slate-100 text-sm leading-relaxed italic">
                "{insights || "Agregue datos para que la IA analice la salud de su club."}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
