
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Plus, X, Edit2, Trash2, AlertCircle, Loader2, MessageCircle, RefreshCw, Check, Clock, Calendar
} from 'lucide-react';
import { getSocios, saveSocio, deleteSocio, getPagos, registrarPago, deletePago, getAsistencia, deleteAsistencia } from '../services/dataService';
import { Socio, Category, Pago, Asistencia } from '../types';

const Socios = () => {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Partial<Socio> | null>(null);
  const [initialPayments, setInitialPayments] = useState({
    inscripcion: false,
    mensual: false,
    seguro: false
  });

  const PRECIOS = { inscripcion: 5000, mensual: 8500, seguro: 3000 };

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
      const [dataSocios, dataPagos, dataAsis] = await Promise.all([getSocios(), getPagos(), getAsistencia()]);
      setSocios(dataSocios || []);
      setPagos(dataPagos || []);
      setAsistencias(dataAsis || []);
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
      const isNew = !editingSocio?.id;
      const savedSocio = await saveSocio(editingSocio);
      const socioId = savedSocio?.id; 

      if (isNew && socioId) {
        // Registrar deuda PENDIENTE si hay opciones seleccionadas
        const promises = [];
        if (initialPayments.inscripcion) {
          promises.push(registrarPago({
            socioId: String(socioId).trim(),
            nombreSocio: `${editingSocio?.nombre || ''} ${editingSocio?.apellido || ''}`,
            mes: mesActual,
            anio: anioActual,
            monto: PRECIOS.inscripcion,
            estado: 'PENDIENTE',
            metodo: 'EFECTIVO',
            tipo: 'INSCRIPCION',
            nota: 'Inscripción inicial'
          }));
        }
        if (initialPayments.mensual) {
          promises.push(registrarPago({
            socioId: String(socioId).trim(),
            nombreSocio: `${editingSocio?.nombre || ''} ${editingSocio?.apellido || ''}`,
            mes: mesActual,
            anio: anioActual,
            monto: PRECIOS.mensual,
            estado: 'PENDIENTE',
            metodo: 'EFECTIVO',
            tipo: 'MENSUAL',
            nota: 'Cuota mensual inicial'
          }));
        }
        if (initialPayments.seguro) {
          promises.push(registrarPago({
            socioId: String(socioId).trim(),
            nombreSocio: `${editingSocio?.nombre || ''} ${editingSocio?.apellido || ''}`,
            mes: mesActual,
            anio: anioActual,
            monto: PRECIOS.seguro,
            estado: 'PENDIENTE',
            metodo: 'EFECTIVO',
            tipo: 'SEGURO',
            nota: 'Seguro inicial'
          }));
        }

        if (promises.length > 0) {
          await Promise.all(promises);
        }
      }

      setIsModalOpen(false);
      setEditingSocio(null);
      setInitialPayments({ inscripcion: false, mensual: false, seguro: false });
      setTimeout(() => fetchData(), 500);
    } catch (err: any) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Confirmas la eliminación definitiva del alumno y todos sus registros (Pagos y Asistencias)?")) {
      setLoading(true);
      try {
        // 1. Buscar todos los pagos del socio
        const pagosSocio = pagos.filter(p => String(p.socioId).trim() === String(id).trim());
        
        // 2. Buscar todas las asistencias del socio
        const asistenciasSocio = asistencias.filter(a => String(a.socioId).trim() === String(id).trim());

        // 3. Borrar cada pago en el servidor
        if (pagosSocio.length > 0) {
          await Promise.all(pagosSocio.map(p => deletePago(p.id)));
        }

        // 4. Borrar cada asistencia en el servidor
        if (asistenciasSocio.length > 0) {
          await Promise.all(asistenciasSocio.map(a => deleteAsistencia(a.id)));
        }

        // 5. Borrar el socio
        await deleteSocio(id);
        
        fetchData();
      } catch (err: any) {
        setError(`Error al eliminar: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const getDetailedStatus = (socioId: string) => {
    const pagosSocioMes = pagos.filter(p => 
      String(p.socioId).trim() === String(socioId).trim() && 
      String(p.mes).trim() === String(mesActual).trim() && 
      String(p.anio).trim() === String(anioActual).trim()
    );

    const status = {
      inscripcion: pagosSocioMes.find(p => p.tipo === 'INSCRIPCION')?.estado || 'N/A',
      mensual: pagosSocioMes.find(p => p.tipo === 'MENSUAL')?.estado || (pagosSocioMes.length === 0 ? 'PENDIENTE' : 'N/A'),
      seguro: pagosSocioMes.find(p => p.tipo === 'SEGURO')?.estado || 'N/A'
    };

    return status;
  };

  const getPaymentStatus = (socioId: string) => {
    const status = getDetailedStatus(socioId);
    // Si mensual es PENDIENTE o no existe, está vencido
    return status.mensual === 'PAGADO';
  };

  const filteredSocios = socios.filter(s => 
    `${s.nombre || ''} ${s.apellido || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWhatsAppLink = (phone: any, isVencido: boolean = false) => {
    if (!phone) return '#';
    const cleanPhone = String(phone).replace(/\D/g, '');
    const message = isVencido ? encodeURIComponent("TU MENSUAL ESTÁ VENCIDO, RECORDÁ ABONAR") : "";
    return `https://wa.me/${cleanPhone}${message ? `?text=${message}` : ''}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "S/D";
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-slate-900">Plantel de Jugadores</h2>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black">
              {socios.length} TOTAL
            </span>
          </div>
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
            onClick={() => { 
              setEditingSocio({ categoria: Category.CHUPETONES, activo: true, fechaInscripcion: fechaHoy }); 
              setInitialPayments({ inscripcion: false, mensual: false, seguro: false });
              setIsModalOpen(true); 
            }}
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
                      <div className="flex flex-col space-y-1">
                        <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase w-fit ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {isPaid ? <Check size={14} strokeWidth={3} /> : <Clock size={14} strokeWidth={3} />}
                          <span>{isPaid ? 'AL DÍA' : 'VENCIDO'}</span>
                        </div>
                        <div className="flex space-x-1 mt-1">
                          {(() => {
                            const status = getDetailedStatus(socio.id);
                            return (
                              <>
                                {status.inscripcion !== 'N/A' && (
                                  <span title="Inscripción" className={`w-2 h-2 rounded-full ${status.inscripcion === 'PAGADO' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                )}
                                {status.mensual !== 'N/A' && (
                                  <span title="Mensual" className={`w-2 h-2 rounded-full ${status.mensual === 'PAGADO' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                )}
                                {status.seguro !== 'N/A' && (
                                  <span title="Seguro" className={`w-2 h-2 rounded-full ${status.seguro === 'PAGADO' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end space-x-2">
                        <a 
                          href={getWhatsAppLink(socio.telefonoTutor, !isPaid)} 
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

      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-fade-in relative flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-[2rem] sm:rounded-t-[2.5rem] shrink-0">
              <div>
                <h3 className="text-xl font-bold text-secondary">{editingSocio?.id ? 'Editar Jugador' : 'Nuevo Ingreso'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Famaillá IF • Gestión de Plantel</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 transition-colors cursor-pointer"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre</label>
                    <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" value={editingSocio?.nombre || ''} onChange={e => setEditingSocio({...editingSocio, nombre: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Apellido</label>
                    <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" value={editingSocio?.apellido || ''} onChange={e => setEditingSocio({...editingSocio, apellido: e.target.value.toUpperCase()})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none appearance-none text-sm" value={editingSocio?.categoria || ''} onChange={e => setEditingSocio({...editingSocio, categoria: e.target.value as Category})}>
                      {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha de Nacimiento</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" 
                      value={editingSocio?.fechaNacimiento || ''} 
                      onChange={e => setEditingSocio({...editingSocio, fechaNacimiento: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha de Ingreso</label>
                    <input 
                      type="date" 
                      required 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" 
                      value={editingSocio?.fechaInscripcion || fechaHoy} 
                      onChange={e => setEditingSocio({...editingSocio, fechaInscripcion: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre del Tutor</label>
                    <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" value={editingSocio?.nombreTutor || ''} onChange={e => setEditingSocio({...editingSocio, nombreTutor: e.target.value.toUpperCase()})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Teléfono / WhatsApp</label>
                  <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" placeholder="381..." value={editingSocio?.telefonoTutor || ''} onChange={e => setEditingSocio({...editingSocio, telefonoTutor: e.target.value})} />
                </div>

                {!editingSocio?.id && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-secondary">Conceptos a Cobrar</h4>
                      <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase">Se cargará como Pendiente</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <label className={`flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all cursor-pointer ${initialPayments.inscripcion ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <input type="checkbox" className="hidden" checked={initialPayments.inscripcion} onChange={e => setInitialPayments({...initialPayments, inscripcion: e.target.checked})} />
                        <span className="text-[8px] font-black uppercase">Inscripción</span>
                      </label>
                      <label className={`flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all cursor-pointer ${initialPayments.mensual ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <input type="checkbox" className="hidden" checked={initialPayments.mensual} onChange={e => setInitialPayments({...initialPayments, mensual: e.target.checked})} />
                        <span className="text-[8px] font-black uppercase">Mensual</span>
                      </label>
                      <label className={`flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all cursor-pointer ${initialPayments.seguro ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <input type="checkbox" className="hidden" checked={initialPayments.seguro} onChange={e => setInitialPayments({...initialPayments, seguro: e.target.checked})} />
                        <span className="text-[8px] font-black uppercase">Seguro</span>
                      </label>
                    </div>
                  </div>
                )}
                <button type="submit" disabled={saving} className="w-full bg-primary text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 mt-2 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all">
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <span>GUARDAR JUGADOR</span>}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Socios;
