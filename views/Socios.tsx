
import React, { useEffect, useState } from 'react';
import { 
  Search, Plus, X, Edit2, Trash2, AlertCircle, Loader2, MessageCircle, RefreshCw, CheckCircle, Clock, Calendar
} from 'lucide-react';
import { getSocios, saveSocio, deleteSocio, getPagos } from '../services/dataService';
import { Socio, Category, Pago } from '../types';

const Socios = () => {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Partial<Socio> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();
  const mesActual = meses[now.getMonth()];
  const anioActual = now.getFullYear();
  const fechaHoy = now.toISOString().split('T')[0];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataSocios, dataPagos] = await Promise.all([getSocios(), getPagos()]);
      setSocios(dataSocios || []);
      setPagos(dataPagos || []);
    } catch (e: any) { 
      console.error("Error en fetchData:", e);
      setError(`Falla de servidor: ${e.message}`);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveSocio(editingSocio);
      setIsModalOpen(false);
      setEditingSocio(null);
      setTimeout(() => fetchData(), 500);
    } catch (err: any) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Confirmas la eliminación definitiva?")) {
      try {
        await deleteSocio(id);
        fetchData();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const getPaymentStatus = (socioId: string) => {
    const pago = pagos.find(p => 
      String(p.socioId) === String(socioId) && 
      p.mes === mesActual && 
      p.anio === anioActual &&
      p.estado === 'PAGADO'
    );
    return !!pago;
  };

  const filteredSocios = socios.filter(s => 
    `${s.nombre || ''} ${s.apellido || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWhatsAppLink = (phone: any) => {
    if (!phone) return '#';
    const cleanPhone = String(phone).replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "S/D";
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Plantel de Jugadores</h2>
          <p className="text-slate-500">Control de estados y pagos de {mesActual} {anioActual}.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-primary transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => { setEditingSocio({ categoria: Category.CEBOLLITAS, activo: true, fechaInscripcion: fechaHoy }); setIsModalOpen(true); }}
            className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nuevo Alumno</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start space-x-3">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-rose-700 font-bold text-sm">Problema con la conexión</p>
            <p className="text-rose-600 text-xs">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600"><X size={18} /></button>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input type="text" placeholder="Buscar jugador..." className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Jugador</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Categoría</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Ingreso</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Estado Cuota</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredSocios.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">No hay jugadores registrados</td></tr>
              ) : filteredSocios.map(socio => {
                const isPaid = getPaymentStatus(socio.id);
                return (
                  <tr key={socio.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900">{socio.nombre} {socio.apellido}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{socio.nombreTutor}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">{socio.categoria}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500">
                        <Calendar size={12} className="text-slate-300" />
                        <span>{formatDate(socio.fechaInscripcion)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isPaid ? <CheckCircle size={12} /> : <Clock size={12} />}
                        <span>{isPaid ? 'AL DÍA' : 'VENCIDO'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end space-x-2">
                        <a 
                          href={getWhatsAppLink(socio.telefonoTutor)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                          <MessageCircle size={18} />
                        </a>
                        <button onClick={() => { setEditingSocio(socio); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-primary bg-white border border-slate-100 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(socio.id)} className="p-2 text-slate-300 hover:text-red-600 bg-white border border-slate-100 rounded-xl transition-all"><Trash2 size={16} /></button>
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
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl my-auto animate-fade-in">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 rounded-t-[2.5rem]">
              <h3 className="text-xl font-bold">{editingSocio?.id ? 'Editar Jugador' : 'Nuevo Ingreso'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre</label>
                  <input required className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" value={editingSocio?.nombre || ''} onChange={e => setEditingSocio({...editingSocio, nombre: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Apellido</label>
                  <input required className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" value={editingSocio?.apellido || ''} onChange={e => setEditingSocio({...editingSocio, apellido: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</label>
                  <select className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold" value={editingSocio?.categoria || ''} onChange={e => setEditingSocio({...editingSocio, categoria: e.target.value as Category})}>
                    {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha de Ingreso</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" 
                    value={editingSocio?.fechaInscripcion || fechaHoy} 
                    onChange={e => setEditingSocio({...editingSocio, fechaInscripcion: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tutor</label>
                  <input required className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold outline-none" value={editingSocio?.nombreTutor || ''} onChange={e => setEditingSocio({...editingSocio, nombreTutor: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp</label>
                  <input required className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold outline-none" value={editingSocio?.telefonoTutor || ''} onChange={e => setEditingSocio({...editingSocio, telefonoTutor: e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 mt-4 flex items-center justify-center space-x-2">
                {saving ? <Loader2 className="animate-spin" size={20} /> : <span>GUARDAR ALUMNO</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Socios;
