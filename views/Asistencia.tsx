
import React, { useEffect, useState } from 'react';
import { 
  ClipboardCheck, 
  Calendar as CalendarIcon, 
  Filter, 
  Save, 
  Loader2, 
  CheckCircle2,
  FileDown
} from 'lucide-react';
import { getSocios, getAsistencia, saveAsistencia } from '../services/dataService';
import { Socio, Category, Asistencia } from '../types';

const AsistenciaView = () => {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [asistenciasTotales, setAsistenciasTotales] = useState<Asistencia[]>([]);
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
      setAsistenciasTotales(currentAsistencias);
      
      const local: Record<string, boolean> = {};
      currentSocios.forEach(socio => {
        const found = currentAsistencias.find(as => 
          String(as.socioId).trim() === String(socio.id).trim() && 
          as.fecha.split('T')[0] === selectedDate
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

  const generateMonthlyPDF = () => {
    const [year, month] = selectedDate.split('-');
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(Number(year), Number(month) - 1));
    
    // Alumnos de la categoría
    const alumnos = socios.filter(s => s.categoria === selectedCat);
    
    // Obtener todos los días del mes que tienen registros
    const registrosMes = asistenciasTotales.filter(as => {
      const asDate = new Date(as.fecha);
      return asDate.getFullYear() === Number(year) && (asDate.getMonth() + 1) === Number(month) && as.categoria === selectedCat;
    });

    // Días únicos con actividad
    const diasConActividad = Array.from(new Set(registrosMes.map(as => as.fecha.split('T')[0]))).sort();

    if (diasConActividad.length === 0) {
      alert("No hay registros de asistencia para este mes en esta categoría.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Reporte Asistencia - ${selectedCat}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #916230; padding-bottom: 20px; margin-bottom: 30px; }
            .club-name { font-size: 24px; font-weight: 800; color: #916230; text-transform: uppercase; }
            .report-title { font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; }
            th { background-color: #f8fafc; color: #64748b; font-weight: 800; text-transform: uppercase; }
            .name-cell { text-align: left; font-weight: 700; width: 200px; }
            .present { color: #10b981; font-weight: 800; }
            .absent { color: #ef4444; font-weight: 400; opacity: 0.3; }
            .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; pt: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="club-name">Famaillá IF</div>
              <div class="report-title">Planilla de Asistencia Mensual</div>
            </div>
            <div style="text-align: right">
              <div style="font-weight: 800">${selectedCat}</div>
              <div style="text-transform: capitalize">${monthName} ${year}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="name-cell">Alumno</th>
                ${diasConActividad.map(dia => `<th>${dia.split('-')[2]}</th>`).join('')}
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              ${alumnos.map(alumno => {
                let presentes = 0;
                const cells = diasConActividad.map(dia => {
                  const reg = registrosMes.find(r => String(r.socioId) === String(alumno.id) && r.fecha.split('T')[0] === dia);
                  const isPresent = reg ? (String(reg.presente).toLowerCase() === 'true') : false;
                  if (isPresent) presentes++;
                  return `<td class="${isPresent ? 'present' : 'absent'}">${isPresent ? '●' : '○'}</td>`;
                }).join('');
                const porcentaje = Math.round((presentes / diasConActividad.length) * 100);
                
                return `
                  <tr>
                    <td class="name-cell">${alumno.nombre} ${alumno.apellido}</td>
                    ${cells}
                    <td style="font-weight: 800; color: ${porcentaje > 70 ? '#10b981' : '#f59e0b'}">${porcentaje}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            Generado automáticamente por Famaillá IF Manager Pro - ${new Date().toLocaleString()}
          </div>
          
          <script>
            window.onload = () => { 
              setTimeout(() => {
                window.print();
                // Opcional: window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filteredSocios = socios.filter(s => s.categoria === selectedCat);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Control de Asistencia</h2>
          <p className="text-slate-500">Registra quiénes vinieron a entrenar hoy.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={generateMonthlyPDF}
            disabled={loading || socios.length === 0}
            className="flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl transition-all shadow-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            <FileDown size={20} />
            <span className="hidden sm:inline">Reporte Mensual</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || filteredSocios.length === 0}
            className="flex items-center justify-center space-x-2 bg-primary hover:opacity-90 text-white px-6 py-3 rounded-xl transition-all shadow-lg font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            <span>{saving ? 'Guardando...' : 'Guardar Hoy'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha de entrenamiento</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Filtrar por Categoría</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-primary/20 font-bold"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value as Category)}
            >
              {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center space-x-3 animate-fade-in shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-500" />
          <p className="font-bold text-xs uppercase tracking-widest">Asistencia sincronizada correctamente</p>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Consultando planilla...</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alumno</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado de Presencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSocios.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-8 py-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest italic">
                      No hay alumnos registrados en esta categoría
                    </td>
                  </tr>
                ) : (
                  filteredSocios.map((socio) => (
                    <tr 
                      key={socio.id} 
                      className={`transition-colors cursor-pointer hover:bg-slate-50/50 ${asistenciaLocal[socio.id] ? 'bg-primary/5' : ''}`}
                      onClick={() => toggleAsistencia(socio.id)}
                    >
                      <td className="px-8 py-5">
                        <div className="font-black text-slate-900">{socio.nombre} {socio.apellido}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">Tutor: {socio.nombreTutor}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                            asistenciaLocal[socio.id] 
                              ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' 
                              : 'bg-slate-100 text-slate-300'
                          }`}>
                            <ClipboardCheck size={24} />
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
