
import React, { useEffect, useState } from 'react';
import { 
  ClipboardCheck, 
  Calendar as CalendarIcon, 
  Filter, 
  Save, 
  Loader2, 
  CheckCircle2,
  FileDown,
  X,
  Plus
} from 'lucide-react';
import { getSocios, getAsistencia, saveAsistencia, saveSocio } from '../services/dataService';
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
  const [activeTab, setActiveTab] = useState<'registro' | 'reporte'>('registro');
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isNewSocioModalOpen, setIsNewSocioModalOpen] = useState(false);
  const [newSocio, setNewSocio] = useState<Partial<Socio>>({});
  const [creatingSocio, setCreatingSocio] = useState(false);

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "S/D";
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleQuickSocioSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSocio(true);
    try {
      const socioToSave = {
        ...newSocio,
        activo: true,
        fechaInscripcion: selectedDate
      };
      const saved = await saveSocio(socioToSave);
      
      // Refresh data
      await fetchData();
      
      // Mark as present automatically
      const newId = saved?.id || `S-${Date.now()}`;
      setAsistenciaLocal(prev => ({ ...prev, [newId]: true }));
      
      setIsNewSocioModalOpen(false);
      setNewSocio({});
    } catch (err) {
      console.error(err);
      alert("Error al crear alumno rápido");
    } finally {
      setCreatingSocio(false);
    }
  };

  const filteredSocios = socios.filter(s => s.categoria === selectedCat);

  const getReportData = () => {
    const [year, month] = reportMonth.split('-');
    return asistenciasTotales.filter(as => {
      const asDate = new Date(as.fecha);
      // Handle potential timezone issues by using local date parts if possible, 
      // but here we just need month/year match
      const dateObj = new Date(as.fecha + (as.fecha.includes('T') ? '' : 'T12:00:00'));
      return dateObj.getFullYear() === Number(year) && (dateObj.getMonth() + 1) === Number(month);
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const reportData = getReportData();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Control de Asistencia</h2>
          <p className="text-slate-500">
            {activeTab === 'registro' ? 'Registra quiénes vinieron a entrenar hoy.' : 'Historial de asistencias registradas.'}
          </p>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'registro' && (
            <>
              <button 
                onClick={() => {
                  setNewSocio({ categoria: selectedCat });
                  setIsNewSocioModalOpen(true);
                }}
                className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg font-semibold"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Nuevo Alumno</span>
              </button>
              <button 
                onClick={generateMonthlyPDF}
                disabled={loading || socios.length === 0}
                className="flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl transition-all shadow-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                <FileDown size={20} />
                <span className="hidden sm:inline">PDF Mensual</span>
              </button>
              <button 
                onClick={handleSave}
                disabled={saving || filteredSocios.length === 0}
                className="flex items-center justify-center space-x-2 bg-primary hover:opacity-90 text-white px-6 py-3 rounded-xl transition-all shadow-lg font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                <span>{saving ? 'Guardando...' : 'Guardar Hoy'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('registro')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'registro' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Toma de Asistencia
        </button>
        <button 
          onClick={() => setActiveTab('reporte')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'reporte' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Reporte Mensual
        </button>
      </div>

      {activeTab === 'registro' ? (
        <>
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
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Seleccionar Mes del Reporte</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="month" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-primary/5 px-6 py-4 rounded-2xl border border-primary/10">
              <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total Registros</div>
              <div className="text-2xl font-black text-secondary">{reportData.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alumno</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin inline text-primary" /></td></tr>
                  ) : reportData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest italic">
                        No hay registros para este mes
                      </td>
                    </tr>
                  ) : (
                    reportData.map((as, idx) => {
                      const socio = socios.find(s => String(s.id) === String(as.socioId));
                      const isPresent = String(as.presente).toLowerCase() === 'true';
                      return (
                        <tr key={as.id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="font-black text-slate-900">{socio ? `${socio.nombre} ${socio.apellido}` : 'Socio no encontrado'}</div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[10px] font-black uppercase bg-slate-100 px-2 py-1 rounded-lg text-slate-500">
                              {as.categoria}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-sm font-bold text-slate-600">{formatDate(as.fecha)}</div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${isPresent ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {isPresent ? <CheckCircle2 size={12} /> : <X size={12} />}
                              <span>{isPresent ? 'Asistido' : 'Ausente'}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isNewSocioModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl my-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-secondary">Registro Rápido</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Añadir alumno y marcar asistencia</p>
              </div>
              <button onClick={() => setIsNewSocioModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
            </div>
            <form onSubmit={handleQuickSocioSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre</label>
                  <input required className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none focus:border-primary" value={newSocio.nombre || ''} onChange={e => setNewSocio({...newSocio, nombre: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Apellido</label>
                  <input required className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none focus:border-primary" value={newSocio.apellido || ''} onChange={e => setNewSocio({...newSocio, apellido: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</label>
                <select className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" value={newSocio.categoria} onChange={e => setNewSocio({...newSocio, categoria: e.target.value as Category})}>
                  {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tutor</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none" value={newSocio.nombreTutor || ''} onChange={e => setNewSocio({...newSocio, nombreTutor: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none" value={newSocio.telefonoTutor || ''} onChange={e => setNewSocio({...newSocio, telefonoTutor: e.target.value})} />
              </div>
              <button type="submit" disabled={creatingSocio} className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 mt-4 flex items-center justify-center space-x-2">
                {creatingSocio ? <Loader2 className="animate-spin" size={20} /> : <span>REGISTRAR Y PRESENTAR</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsistenciaView;
