
import React, { useEffect, useState } from 'react';
import { 
  ClipboardCheck, 
  Calendar as CalendarIcon, 
  Filter, 
  Save, 
  Loader2, 
  CheckCircle2
} from 'lucide-react';
import { getSocios, getAsistencia, saveAsistencia } from '../services/dataService';
import { Socio, Category, Asistencia } from '../types';

const AsistenciaView = () => {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCat, setSelectedCat] = useState<Category>(Category.CEBOLLITAS);
  const [asistenciaLocal, setAsistenciaLocal] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([getSocios(), getAsistencia()]);
      const currentSocios = s || [];
      const currentAsistencias = a || [];
      
      setSocios(currentSocios);
      
      const local: Record<string, boolean> = {};
      currentSocios.forEach(socio => {
        const found = currentAsistencias.find(as => 
          String(as.socioId).trim() === String(socio.id).trim() && 
          as.fecha === selectedDate
        );
        local[socio.id] = found ? (String(found.presente).toLowerCase() === 'true') : false;
      });
      setAsistenciaLocal(local);
    } catch (e) {
      console.error("Error fetching attendance:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedCat]);

  const toggleAsistencia = (socioId: string) => {
    setAsistenciaLocal(prev => ({ ...prev, [socioId]: !prev[socioId] }));
  };

  const handleSave = async () => {
    setSaving(true);
    const batch = filteredSocios.map(s => ({
      socioId: s.id,
      fecha: selectedDate,
      categoria: selectedCat,
      presente: asistenciaLocal[s.id] || false
    }));
    
    try {
      await saveAsistencia(batch);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredSocios = socios.filter(s => s.categoria === selectedCat);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Control de Asistencia</h2>
          <p className="text-slate-500">Registra quiénes vinieron a entrenar hoy.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving || filteredSocios.length === 0}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg font-semibold disabled:opacity-50"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          <span>{saving ? 'Guardando...' : 'Guardar Asistencia'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Fecha</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Categoría</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value as Category)}
            >
              {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center space-x-3 animate-fade-in">
          <CheckCircle2 size={20} />
          <p className="font-medium text-sm">Asistencia guardada correctamente.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-slate-400 font-medium">Cargando lista...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Alumno</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSocios.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-10 text-center text-slate-400 font-medium">
                      No hay alumnos registrados en esta categoría.
                    </td>
                  </tr>
                ) : (
                  filteredSocios.map((socio) => (
                    <tr 
                      key={socio.id} 
                      className={`transition-colors cursor-pointer hover:bg-slate-50/50 ${asistenciaLocal[socio.id] ? 'bg-blue-50/30' : ''}`}
                      onClick={() => toggleAsistencia(socio.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{socio.nombre} {socio.apellido}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{socio.categoria}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            asistenciaLocal[socio.id] 
                              ? 'bg-blue-600 text-white shadow-lg' 
                              : 'bg-slate-100 text-slate-300'
                          }`}>
                            <ClipboardCheck size={20} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsistenciaView;
