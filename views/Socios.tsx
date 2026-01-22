
import React, { useEffect, useState } from 'react';
import { 
  Search, Plus, Filter, X, Edit2, Trash2, AlertCircle, Loader2, MessageCircle
} from 'lucide-react';
import { getSocios, saveSocio, deleteSocio } from '../services/dataService';
import { Socio, Category } from '../types';

const Socios = () => {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Partial<Socio> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSocios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSocios();
      setSocios(data || []);
    } catch (e) { 
      console.error(e);
      setError("No se pudieron cargar los socios.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchSocios(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await saveSocio(editingSocio);
      if (result) {
        setIsModalOpen(false);
        setEditingSocio(null);
        await fetchSocios();
      } else {
        setError("Error al guardar. Verifica la conexión.");
      }
    } catch (err) {
      setError("Error crítico al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Confirmas la eliminación definitiva?")) {
      await deleteSocio(id);
      fetchSocios();
    }
  };

  const filteredSocios = socios.filter(s => 
    `${s.nombre} ${s.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Plantel de Jugadores</h2>
          <p className="text-slate-500">Administra el listado oficial de FAMAILLA IF.</p>
        </div>
        <button 
          onClick={() => { setEditingSocio({ categoria: Category.CEBOLLITAS, activo: true }); setIsModalOpen(true); }}
          className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nuevo Alumno</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold">{editingSocio?.id ? 'Editar Jugador' : 'Nuevo Ingreso'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
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
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</label>
                <select className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold" value={editingSocio?.categoria || ''} onChange={e => setEditingSocio({...editingSocio, categoria: e.target.value as Category})}>
                  {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
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

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input type="text" placeholder="Buscar jugador..." className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Jugador</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Categoría</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
            ) : filteredSocios.length === 0 ? (
              <tr><td colSpan={3} className="p-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">No hay jugadores registrados</td></tr>
            ) : filteredSocios.map(socio => (
              <tr key={socio.id} className="hover:bg-slate-50 transition-all">
                <td className="px-8 py-5">
                  <div className="font-black text-slate-900">{socio.nombre} {socio.apellido}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{socio.nombreTutor} • {socio.telefonoTutor}</div>
                </td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 rounded-xl bg-accent/20 text-secondary text-[10px] font-black uppercase tracking-wider">{socio.categoria}</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end space-x-2">
                    <a 
                      href={`https://wa.me/${socio.telefonoTutor.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Contactar WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </a>
                    <button onClick={() => { setEditingSocio(socio); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-primary bg-white border border-slate-100 rounded-xl hover:shadow-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(socio.id)} className="p-2 text-slate-300 hover:text-red-600 bg-white border border-slate-100 rounded-xl hover:shadow-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Socios;
