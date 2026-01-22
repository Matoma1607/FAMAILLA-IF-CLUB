
import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Search, Plus, Loader2, X, RefreshCw, AlertCircle
} from 'lucide-react';
import { getPagos, getSocios, registrarPago, updateEstadoPago, generarMensualidades } from '../services/dataService.ts';
import { Pago, Socio } from '../types.ts';

const Pagos = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPago, setEditingPago] = useState<Partial<Pago> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [p, s] = await Promise.all([getPagos(), getSocios()]);
    setPagos(p || []);
    setSocios(s || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPago?.socioId) return;
    setProcessing(true);
    await registrarPago(editingPago);
    setProcessing(false);
    setIsModalOpen(false);
    fetchData();
  };

  const togglePago = async (id: string, current: string) => {
    const next = current === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
    await updateEstadoPago(id, next);
    fetchData();
  };

  const filteredPagos = pagos.filter(p => {
    const socio = socios.find(s => String(s.id) === String(p.socioId));
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    if (!socio) return false;
    return `${socio.nombre} ${socio.apellido}`.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Finanzas</h2>
          <p className="text-slate-500">Control de cuotas y cobros.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => { setEditingPago({ mes: 'Marzo', anio: 2025, monto: 8500 }); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-bold shadow-lg">
            <Plus size={18} />
            <span>Nuevo Cobro</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar alumno..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Alumno</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Período</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Monto</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin inline mr-2" /> Cargando...</td></tr>
            ) : filteredPagos.map(p => {
              const socio = socios.find(s => String(s.id) === String(p.socioId));
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {socio ? `${socio.nombre} ${socio.apellido}` : `ID: ${p.socioId}`}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{p.mes} {p.anio}</td>
                  <td className="px-6 py-4 font-black text-slate-900">${p.monto}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => togglePago(p.id, p.estado)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${p.estado === 'PAGADO' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {p.estado}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Registrar Cobro</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <select required className="w-full p-3 border rounded-xl" value={editingPago?.socioId || ""} onChange={e => setEditingPago({...editingPago, socioId: e.target.value})}>
                <option value="">Seleccionar Alumno...</option>
                {socios.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
              </select>
              <input type="number" placeholder="Monto" className="w-full p-3 border rounded-xl" value={editingPago?.monto || ""} onChange={e => setEditingPago({...editingPago, monto: Number(e.target.value)})} />
              <button type="submit" disabled={processing} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
                {processing ? 'Guardando...' : 'Guardar Pago'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
