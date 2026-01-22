
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  BrainCircuit,
  Loader2,
  Database,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { getSocios, getPagos, GAS_URL } from '../services/dataService.ts';
import { getClubInsights } from '../services/geminiService.ts';
import { Link } from 'react-router-dom';

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
  const [insights, setInsights] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);

  const isConfigured = !GAS_URL.includes('TU_ID_AQUI');
  const COLORS = ['#916230', '#2f364a', '#c6cde3', '#475569'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const socios = await getSocios();
        const pagos = await getPagos();
        const deudoresCount = (pagos || []).filter(p => p.estado === 'PENDIENTE').length;
        const recaudacion = (pagos || []).filter(p => p.estado === 'PAGADO').reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);

        setStats({
          total: (socios || []).length,
          activos: (socios || []).filter(s => s.activo).length,
          deudores: deudoresCount,
          recaudacion: recaudacion
        });

        if (socios && socios.length > 0) {
          setInsightsLoading(true);
          const aiInsights = await getClubInsights({ clubName: "Famaillá IF", sociosCount: socios.length, deudoresCount, recaudacion });
          setInsights(aiInsights);
          setInsightsLoading(false);
        } else {
          setInsights("¡Base de Famaillá IF conectada! Agrega a tu primer socio para empezar el análisis.");
        }
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex flex-col items-center justify-center h-64 space-y-4"><Loader2 className="w-8 h-8 text-primary animate-spin" /><p className="text-slate-500 animate-pulse font-medium">Sincronizando con Famaillá IF Database...</p></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Panel de Control</h2>
          <p className="text-slate-500">Estado institucional de Famaillá IF.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Alumnos" value={stats.total} icon={Users} colorClass="bg-primary" trend={stats.total > 0 ? "Actualizado" : "Sin datos"} />
        <StatCard title="Plantel Activo" value={stats.activos} icon={TrendingUp} colorClass="bg-secondary" />
        <StatCard title="Pendientes Cobro" value={stats.deudores} icon={AlertCircle} colorClass="bg-amber-600" />
        <StatCard title="Caja Mensual" value={`$${stats.recaudacion.toLocaleString()}`} icon={DollarSign} colorClass="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-accent shadow-sm">
          <h3 className="text-lg font-bold text-secondary mb-6">Distribución por Categorías</h3>
          <div className="h-64">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{name: 'Cebollitas', v: 30}, {name: 'Pre-Decima', v: 45}, {name: 'Decima', v: 25}]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                    <Cell fill="#916230" /><Cell fill="#2f364a" /><Cell fill="#c6cde3" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-accent rounded-xl">
                <Users size={48} className="mb-2 opacity-20" />
                <p>Esperando registro de alumnos</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-2xl shadow-xl text-white">
          <div className="flex items-center space-x-2 mb-4">
            <BrainCircuit size={24} className="text-primary" />
            <h3 className="text-lg font-bold tracking-tight">AI Advisor: Famaillá IF</h3>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 min-h-[160px] border border-white/10">
            {insightsLoading ? (
              <div className="flex flex-col items-center justify-center h-32 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-accent">Generando reporte estratégico...</p>
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
