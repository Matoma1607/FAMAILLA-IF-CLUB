
import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Search, Plus, Loader2, X, Trash2, Edit2
} from 'lucide-react';
import { getPagos, getSocios, registrarPago, updateEstadoPago, deletePago } from '../services/dataService';
import { Pago, Socio } from '../types';

const Pagos = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPago, setEditingPago] = useState<Partial<Pago> | null>(null);

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const now = new Date();
  const mesActual = meses[now.getMonth()];
  const anioActual = now.getFullYear();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getPagos(), getSocios()]);
      setPagos(p || []);
      setSocios(s || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPago?.socioId) return;
    setProcessing(true);
    try {
      await registrarPago(editingPago);
      setIsModalOpen(false);
      setEditingPago(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const togglePago = async (id: string, current: string) => {
    const next = current === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
    try {
      await updateEstadoPago(id, next);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Confirmas la eliminación de este registro de pago?")) {
      try {
        await deletePago(id);
        fetchData();
      } catch (err) {
        console.error(err);
      }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Finanzas</h2>
          <p className="text-slate-500">Control de cuotas y cobros de FAMAILLA IF.</p>
        </div>
        <button 
          onClick={() => { setEditingPago({ mes: mesActual, anio: anioActual, monto: 8500, estado: 'PAGADO' }); setIsModalOpen(true); }} 
          className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center space-x-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Nuevo Cobro</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar alumno..." 
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium focus:ring-2 focus:ring-primary/10" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
        
        {/* Wrapper para scroll horizontal en móviles */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Alumno</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Período</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Monto</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center">Estado</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin inline text-primary mr-2" /> <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando registros...</span></td></tr>
              ) : filteredPagos.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest italic">No se encontraron registros de pago</td></tr>
              ) : filteredPagos.map(p => {
                const socio = socios.find(s => String(s.id) === String(p.socioId));
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900">
                      {socio ? `${socio.nombre} ${socio.apellido}` : `ID: ${p.socioId}`}
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-slate-100 inline-block px-2 py-1 rounded-lg">
                        {p.mes} {p.anio}
                      </div>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-900 text-lg tracking-tighter">
                      ${Number(p.monto).toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => togglePago(p.id, p.estado)} 
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm hover:scale-105 active:scale-95 ${
                          p.estado === 'PAGADO' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}
                      >
                        {p.estado}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end space-x-1">
                        <button onClick={() => { setEditingPago(p); setIsModalOpen(true); }} className="p-2.5 text-slate-300 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 overflow-hidden relative">
            <div className="flex justify-between items-center mb-8">
               <div>
                 <h3 className="text-xl font-bold text-secondary">{editingPago?.id ? 'Editar Cobro' : 'Registrar Cobro'}</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tesorería Famaillá IF</p>
               </div>
               <button onClick={() => { setIsModalOpen(false); setEditingPago(null); }} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Alumno</label>
                <select 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-primary transition-all appearance-none" 
                  value={editingPago?.socioId || ""} 
                  onChange={e => setEditingPago({...editingPago, socioId: e.target.value})}
                >
                  <option value="">Seleccionar Alumno...</option>
                  {socios.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mes</label>
                  <select 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none appearance-none" 
                    value={editingPago?.mes || ""} 
                    onChange={e => setEditingPago({...editingPago, mes: e.target.value})}
                  >
                    {meses.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Año</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" 
                    value={editingPago?.anio || anioActual} 
                    onChange={e => setEditingPago({...editingPago, anio: Number(e.target.value)})} 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Monto ($)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="8500" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-lg outline-none focus:border-primary transition-all" 
                  value={editingPago?.monto || ""} 
                  onChange={e => setEditingPago({...editingPago, monto: Number(e.target.value)})} 
                />
              </div>
              <button 
                type="submit" 
                disabled={processing} 
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 mt-6 flex items-center justify-center space-x-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
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
