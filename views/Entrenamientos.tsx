
import React, { useEffect, useState } from 'react';
import { 
  Calendar, MapPin, Clock, Plus, Loader2, Trash2, Edit2, X, User, Trophy, Dumbbell
} from 'lucide-react';
import { getEntrenamientos, saveEntrenamiento, deleteEntrenamiento } from '../services/dataService';
import { Entrenamiento, Category, EventType } from '../types';

const Entrenamientos = () => {
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const [loading, setLoading] = useState(true);
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
    await saveEntrenamiento(editingEnt);
    setIsModalOpen(false);
    fetchEntrenamientos();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Diario Técnico</h2>
          <p className="text-slate-500">Entrenamientos y Partidos.</p>
        </div>
        <button onClick={() => { setEditingEnt({ tipo: 'Entrenamiento', dia: 'Lunes', categoria: Category.CEBOLLITAS }); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 font-bold shadow-lg">
          <Plus size={20} />
          <span>Nuevo Evento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full text-center py-20"><Loader2 className="animate-spin inline" /> Cargando agenda...</div> : 
          entrenamientos.map(ent => (
            <div key={ent.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-black uppercase mb-4 ${ent.tipo === 'Partido' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                {ent.tipo === 'Partido' ? <Trophy size={14} /> : <Dumbbell size={14} />}
                <span>{ent.tipo}</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900">{ent.dia}</h4>
              <p className="text-xs font-black text-blue-600 uppercase mb-4">{ent.categoria}</p>
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
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8">
            <h3 className="text-xl font-bold mb-6">Programar Fecha</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select className="p-3 border rounded-xl" value={editingEnt?.tipo} onChange={e => setEditingEnt({...editingEnt, tipo: e.target.value as EventType})}>
                  <option value="Entrenamiento">Entrenamiento</option>
                  <option value="Partido">Partido</option>
                </select>
                <select className="p-3 border rounded-xl" value={editingEnt?.categoria} onChange={e => setEditingEnt({...editingEnt, categoria: e.target.value as Category})}>
                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input placeholder="Día (ej: Sábado 15)" className="w-full p-3 border rounded-xl" value={editingEnt?.dia || ""} onChange={e => setEditingEnt({...editingEnt, dia: e.target.value})} />
              <input placeholder="Profesor" className="w-full p-3 border rounded-xl" value={editingEnt?.profesor || ""} onChange={e => setEditingEnt({...editingEnt, profesor: e.target.value})} />
              <input placeholder="Lugar" className="w-full p-3 border rounded-xl" value={editingEnt?.lugar || ""} onChange={e => setEditingEnt({...editingEnt, lugar: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">GUARDAR EN AGENDA</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entrenamientos;
