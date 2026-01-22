
import React, { useEffect, useState } from 'react';
import { 
  Calendar, MapPin, Clock, Plus, Loader2, Trash2, Edit2, X, User, Trophy, Dumbbell
} from 'lucide-react';
import { getEntrenamientos, saveEntrenamiento, deleteEntrenamiento } from '../services/dataService';
import { Entrenamiento, Category, EventType } from '../types';

const Entrenamientos = () => {
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnt, setEditingEnt] = useState<Partial<Entrenamiento> | null>(null);

  const fetchEntrenamientos = async () => {
    setLoading(true);
    const data = await getEntrenamientos();
    setEntrenamientos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEntrenamientos(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    await saveEntrenamiento(editingEnt);
    setProcessing(false);
    setIsModalOpen(false);
    setEditingEnt(null);
    fetchEntrenamientos();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Confirmas que deseas eliminar este evento de la agenda?")) {
      await deleteEntrenamiento(id);
      fetchEntrenamientos();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Diario Técnico</h2>
          <p className="text-slate-500">Agenda de FAMAILLA IF (Entrenamientos y Partidos).</p>
        </div>
        <button onClick={() => { setEditingEnt({ tipo: 'Entrenamiento', dia: 'Lunes', categoria: Category.CEBOLLITAS }); setIsModalOpen(true); }} className="bg-primary text-white px-8 py-3 rounded-2xl flex items-center space-x-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all">
          <Plus size={20} />
          <span>Nuevo Evento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full text-center py-20"><Loader2 className="animate-spin inline text-primary" /> Cargando agenda...</div> : 
          entrenamientos.length === 0 ? <div className="col-span-full text-center py-20 text-slate-400">No hay eventos programados</div> :
          entrenamientos.map(ent => (
            <div key={ent.id} className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingEnt(ent); setIsModalOpen(true); }} className="p-2 bg-white border rounded-xl text-slate-400 hover:text-primary shadow-sm transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(ent.id)} className="p-2 bg-white border rounded-xl text-slate-400 hover:text-red-600 shadow-sm transition-colors"><Trash2 size={16} /></button>
              </div>
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-black uppercase mb-4 ${ent.tipo === 'Partido' ? 'bg-amber-50 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                {ent.tipo === 'Partido' ? <Trophy size={14} /> : <Dumbbell size={14} />}
                <span>{ent.tipo}</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900">{ent.dia}</h4>
              <p className="text-xs font-black text-primary uppercase mb-4">{ent.categoria}</p>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2"><Clock size={16}/> <span>{ent.hora} HS</span></div>
                <div className="flex items-center space-x-2"><MapPin size={16}/> <span>{ent.lugar}</span></div>
                <div className="flex items-center space-x-2"><User size={16}/> <span className="font-bold">{ent.profesor || "Sin Profe asignado"}</span></div>
              </div>
            </div>
          ))
        }
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingEnt?.id ? 'Editar Evento' : 'Programar Fecha'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingEnt(null); }} className="text-slate-400"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo</label>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={editingEnt?.tipo} onChange={e => setEditingEnt({...editingEnt, tipo: e.target.value as EventType})}>
                    <option value="Entrenamiento">Entrenamiento</option>
                    <option value="Partido">Partido</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</label>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={editingEnt?.categoria} onChange={e => setEditingEnt({...editingEnt, categoria: e.target.value as Category})}>
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Día y Fecha</label>
                <input required placeholder="Sábado 15" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" value={editingEnt?.dia || ""} onChange={e => setEditingEnt({...editingEnt, dia: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hora</label>
                  <input required placeholder="18:30" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" value={editingEnt?.hora || ""} onChange={e => setEditingEnt({...editingEnt, hora: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Profesor</label>
                  <input required placeholder="Profe Gómez" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" value={editingEnt?.profesor || ""} onChange={e => setEditingEnt({...editingEnt, profesor: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Lugar / Cancha</label>
                <input required placeholder="Cancha Principal" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" value={editingEnt?.lugar || ""} onChange={e => setEditingEnt({...editingEnt, lugar: e.target.value})} />
              </div>
              <button type="submit" disabled={processing} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 mt-4 flex items-center justify-center space-x-2">
                {processing ? <Loader2 className="animate-spin" size={20} /> : <span>GUARDAR EN AGENDA</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entrenamientos;
