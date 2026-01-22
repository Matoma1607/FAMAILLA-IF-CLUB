
import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Search, Plus, Loader2, X, Trash2, Edit2
} from 'lucide-react';
import { getPagos, getSocios, registrarPago, updateEstadoPago, deletePago } from '../services/dataService.ts';
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
    setEditingPago(null);
    fetchData();
  };

  const togglePago = async (id: string, current: string) => {
    const next = current === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
    await updateEstadoPago(id, next);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Confirmas la eliminación de este registro de pago?")) {
      await deletePago(id);
      fetchData();
    }
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
          <p className="text-slate-500">Control de cuotas y cobros de FAMAILLA IF.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => { setEditingPago({ mes: 'Marzo', anio: 2025, monto: 8500, estado: 'PAGADO' }); setIsModalOpen(true); }} className="bg-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
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
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Estado</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin inline mr-2 text-primary" /> Cargando...</td></tr>
            ) : filteredPagos.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-slate-400">No se encontraron registros</td></tr>
            ) : filteredPagos.map(p => {
              const socio = socios.find(s => String(s.id) === String(p.socioId));
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {socio ? `${socio.nombre} ${socio.apellido}` : `ID: ${p.socioId}`}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{p.mes} {p.anio}</td>
                  <td className="px-6 py-4 font-black text-slate-900">${p.monto}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => togglePago(p.id, p.estado)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${p.estado === 'PAGADO' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {p.estado}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1">
                      <button onClick={() => { setEditingPago(p); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold">{editingPago?.id ? 'Editar Cobro' : 'Registrar Cobro'}</h3>
               <button onClick={() => { setIsModalOpen(false); setEditingPago(null); }} className="text-slate-400"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Alumno</label>
                <select required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" value={editingPago?.socioId || ""} onChange={e => setEditingPago({...editingPago, socioId: e.target.value})}>
                  <option value="">Seleccionar Alumno...</option>
                  {socios.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mes</label>
                  <select required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={editingPago?.mes || ""} onChange={e => setEditingPago({...editingPago, mes: e.target.value})}>
                    {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Año</label>
                  <input type="number" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={editingPago?.anio || 2025} onChange={e => setEditingPago({...editingPago, anio: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Monto ($)</label>
                <input type="number" required placeholder="8500" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" value={editingPago?.monto || ""} onChange={e => setEditingPago({...editingPago, monto: Number(e.target.value)})} />
              </div>
              <button type="submit" disabled={processing} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 mt-4 flex items-center justify-center space-x-2">
                {processing ? <Loader2 className="animate-spin" size={20} /> : <span>GUARDAR REGISTRO</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
