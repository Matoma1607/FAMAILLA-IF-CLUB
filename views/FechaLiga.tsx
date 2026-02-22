
import React, { useEffect, useState } from 'react';
import { 
  Trophy, MapPin, Clock, Plus, Loader2, Trash2, Edit2, X, Calendar, Shield
} from 'lucide-react';
import { getFechasLiga, saveFechaLiga, deleteFechaLiga } from '../services/dataService';
import { FechaLiga, Category } from '../types';

const FechaLigaView = ({ isOwner }: { isOwner: boolean }) => {
  const [fechas, setFechas] = useState<FechaLiga[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFecha, setEditingFecha] = useState<Partial<FechaLiga> | null>(null);

  const fetchFechas = async () => {
    setLoading(true);
    try {
      const data = await getFechasLiga();
      setFechas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFechas(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setProcessing(true);
    try {
      await saveFechaLiga(editingFecha);
      setIsModalOpen(false);
      setEditingFecha(null);
      await fetchFechas();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la fecha de liga.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isOwner) return;
    if (window.confirm("¿Confirmas que deseas eliminar esta fecha de liga?")) {
      await deleteFechaLiga(id);
      fetchFechas();
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "S/H";
    // Si viene en formato ISO de Google Sheets (1899-...)
    if (timeStr.includes('T') && timeStr.includes('1899')) {
      const date = new Date(timeStr);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return timeStr;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Fecha de Liga</h2>
          <p className="text-slate-500">Programación de partidos oficiales de FAMAILLA IF.</p>
        </div>
        {isOwner && (
          <button 
            onClick={() => { setEditingFecha({ rival: '', fecha: '', hora: '', lugar: '', categoria: Category.CHUPETONES, condicion: 'LOCAL' }); setIsModalOpen(true); }} 
            className="bg-primary text-white px-8 py-3 rounded-2xl flex items-center space-x-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
          >
            <Plus size={20} />
            <span>Nueva Fecha</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20">
            <Loader2 className="animate-spin inline text-primary" /> 
            <span className="ml-2 text-slate-400 font-bold uppercase text-xs tracking-widest">Cargando fechas...</span>
          </div>
        ) : fechas.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest italic">
            No hay fechas de liga programadas
          </div>
        ) : (
          fechas.map(f => (
            <div key={f.id} className="group relative bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              {isOwner && (
                <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingFecha(f); setIsModalOpen(true); }} className="p-2 bg-white border rounded-xl text-slate-400 hover:text-primary shadow-sm transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(f.id)} className="p-2 bg-white border rounded-xl text-slate-400 hover:text-red-600 shadow-sm transition-colors"><Trash2 size={16} /></button>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${f.condicion === 'LOCAL' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Shield size={14} />
                  <span>{f.condicion}</span>
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">FAMAILLA IF</div>
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rival</p>
                <h4 className="text-xl font-black text-secondary uppercase tracking-tight leading-none">{f.rival}</h4>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-slate-500">
                    <Calendar size={16} className="text-primary" />
                    <span className="font-bold">{f.fecha}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500">
                    <Clock size={16} className="text-primary" />
                    <span className="font-bold">{formatTime(f.hora)} HS</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <MapPin size={16} className="text-primary" />
                  <span className="font-medium">{f.lugar}</span>
                </div>
                <div className="pt-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {f.categoria}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && isOwner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-fade-in relative flex flex-col max-h-[95vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-[2.5rem] shrink-0">
              <div>
                <h3 className="text-xl font-bold text-secondary">{editingFecha?.id ? 'Editar Fecha' : 'Nueva Fecha de Liga'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Competición Oficial</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingFecha(null); }} className="text-slate-300 hover:text-slate-600 p-2 transition-colors"><X size={24} /></button>
            </div>
            
            <div className="overflow-y-auto p-6 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Rival</label>
                  <input required placeholder="Nombre del Club Rival" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" value={editingFecha?.rival || ""} onChange={e => setEditingFecha({...editingFecha, rival: e.target.value.toUpperCase()})} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Condición</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none appearance-none text-sm" value={editingFecha?.condicion} onChange={e => setEditingFecha({...editingFecha, condicion: e.target.value as any})}>
                      <option value="LOCAL">Local</option>
                      <option value="VISITANTE">Visitante</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none appearance-none text-sm" value={editingFecha?.categoria} onChange={e => setEditingFecha({...editingFecha, categoria: e.target.value})}>
                      {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha</label>
                    <input required placeholder="Domingo 22/05" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" value={editingFecha?.fecha || ""} onChange={e => setEditingFecha({...editingFecha, fecha: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hora</label>
                    <input required placeholder="10:00" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" value={editingFecha?.hora || ""} onChange={e => setEditingFecha({...editingFecha, hora: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Lugar / Estadio</label>
                  <input required placeholder="Cancha de Famaillá IF" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" value={editingFecha?.lugar || ""} onChange={e => setEditingFecha({...editingFecha, lugar: e.target.value.toUpperCase()})} />
                </div>

                <button type="submit" disabled={processing} className="w-full bg-primary text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 mt-2 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all">
                  {processing ? <Loader2 className="animate-spin" size={18} /> : <span>GUARDAR FECHA</span>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FechaLigaView;
