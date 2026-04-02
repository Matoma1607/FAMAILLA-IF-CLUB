
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Trophy, MapPin, Clock, Plus, Loader2, Trash2, Edit2, X, Calendar, Shield, Users, DollarSign, Filter, ChevronRight, TrendingUp, Map
} from 'lucide-react';
import { getFechasLiga, saveFechaLiga, deleteFechaLiga, getSocios, getPagosPartidos, savePagoPartido, deletePagoPartido } from '../services/dataService';
import { FechaLiga, Category, Socio, PagoPartido } from '../types';

const FechaLigaView = ({ isOwner }: { isOwner: boolean }) => {
  const [activeTab, setActiveTab] = useState<'calendario' | 'recaudacion' | 'resumen'>('calendario');
  const [fechas, setFechas] = useState<FechaLiga[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [pagosPartidos, setPagosPartidos] = useState<PagoPartido[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFecha, setEditingFecha] = useState<Partial<FechaLiga> | null>(null);
  
  // State for match payment
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [paymentData, setPaymentData] = useState({
    monto: 0,
    tipo: 'LOCAL' as 'LOCAL' | 'VIAJE',
    rival: '',
    fecha: new Date().toISOString().split('T')[0]
  });
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.CEBOLLITAS);

  // Filters for Resumen
  const [resumenFilter, setResumenFilter] = useState({
    categoria: 'TODAS',
    fechaDesde: '',
    fechaHasta: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fechasData, sociosData, pagosData] = await Promise.all([
        getFechasLiga(),
        getSocios(),
        getPagosPartidos()
      ]);
      setFechas(fechasData || []);
      setSocios(sociosData || []);
      setPagosPartidos(pagosData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setProcessing(true);
    try {
      await saveFechaLiga(editingFecha);
      setIsModalOpen(false);
      setEditingFecha(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la fecha de liga.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !selectedSocio) return;
    setProcessing(true);
    try {
      const nuevoPago: Partial<PagoPartido> = {
        socioId: selectedSocio.id,
        nombreSocio: `${selectedSocio.nombre} ${selectedSocio.apellido}`,
        categoria: selectedSocio.categoria,
        ...paymentData
      };
      await savePagoPartido(nuevoPago);
      setIsPaymentModalOpen(false);
      setSelectedSocio(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Error al registrar el pago del partido.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isOwner) return;
    if (window.confirm("¿Confirmas que deseas eliminar esta fecha de liga?")) {
      await deleteFechaLiga(id);
      fetchData();
    }
  };

  const handleDeletePago = async (id: string) => {
    if (!isOwner) return;
    if (window.confirm("¿Confirmas que deseas eliminar este registro de pago?")) {
      await deletePagoPartido(id);
      fetchData();
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "S/H";
    if (timeStr.includes('T') && timeStr.includes('1899')) {
      const date = new Date(timeStr);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return timeStr;
  };

  const filteredSocios = useMemo(() => {
    return socios.filter(s => s.categoria === selectedCategory && s.activo);
  }, [socios, selectedCategory]);

  const filteredPagos = useMemo(() => {
    return pagosPartidos.filter(p => {
      const matchCat = resumenFilter.categoria === 'TODAS' || p.categoria === resumenFilter.categoria;
      const matchDesde = !resumenFilter.fechaDesde || p.fecha >= resumenFilter.fechaDesde;
      const matchHasta = !resumenFilter.fechaHasta || p.fecha <= resumenFilter.fechaHasta;
      return matchCat && matchDesde && matchHasta;
    });
  }, [pagosPartidos, resumenFilter]);

  const totals = useMemo(() => {
    return filteredPagos.reduce((acc, p) => {
      if (p.tipo === 'LOCAL') acc.local += p.monto;
      else acc.viaje += p.monto;
      return acc;
    }, { local: 0, viaje: 0 });
  }, [filteredPagos]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Fecha de Liga</h2>
          <p className="text-slate-500">Gestión de partidos y recaudación por encuentros.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('calendario')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'calendario' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Calendario
          </button>
          <button 
            onClick={() => setActiveTab('recaudacion')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'recaudacion' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Recaudación
          </button>
          <button 
            onClick={() => setActiveTab('resumen')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'resumen' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Resumen
          </button>
        </div>
      </div>

      {activeTab === 'calendario' && (
        <>
          <div className="flex justify-end">
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
        </>
      )}

      {activeTab === 'recaudacion' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Filter size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Filtrar por Categoría</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Selecciona una división para ver los socios</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(Category).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-20">
                <Loader2 className="animate-spin inline text-primary" />
              </div>
            ) : filteredSocios.length === 0 ? (
              <div className="col-span-full text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest italic">
                No hay socios activos en esta categoría
              </div>
            ) : (
              filteredSocios.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSocio(s);
                    setPaymentData({
                      ...paymentData,
                      rival: fechas.find(f => f.categoria === s.categoria)?.rival || ''
                    });
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:border-primary/30 hover:shadow-xl transition-all group text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase tracking-tight">{s.nombre} {s.apellido}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.categoria}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp size={80} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recaudación Total</p>
              <h3 className="text-4xl font-black text-secondary tracking-tighter">${(totals.local + totals.viaje).toLocaleString()}</h3>
              <div className="mt-4 flex items-center space-x-2 text-emerald-500">
                <DollarSign size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Ingresos Confirmados</span>
              </div>
            </div>

            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600">
                <Shield size={80} />
              </div>
              <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-2">Partidos de Local</p>
              <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">${totals.local.toLocaleString()}</h3>
              <div className="mt-4 flex items-center space-x-2 text-emerald-600">
                <MapPin size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">{filteredPagos.filter(p => p.tipo === 'LOCAL').length} Encuentros</span>
              </div>
            </div>

            <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600">
                <Map size={80} />
              </div>
              <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-2">Partidos de Viaje</p>
              <h3 className="text-4xl font-black text-blue-600 tracking-tighter">${totals.viaje.toLocaleString()}</h3>
              <div className="mt-4 flex items-center space-x-2 text-blue-600">
                <MapPin size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">{filteredPagos.filter(p => p.tipo === 'VIAJE').length} Encuentros</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none appearance-none text-sm"
                  value={resumenFilter.categoria}
                  onChange={e => setResumenFilter({...resumenFilter, categoria: e.target.value})}
                >
                  <option value="TODAS">TODAS LAS CATEGORÍAS</option>
                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Desde</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-sm"
                  value={resumenFilter.fechaDesde}
                  onChange={e => setResumenFilter({...resumenFilter, fechaDesde: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hasta</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-sm"
                  value={resumenFilter.fechaHasta}
                  onChange={e => setResumenFilter({...resumenFilter, fechaHasta: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* List of Payments */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Socio</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Categoría</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Fecha</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Tipo</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Monto</th>
                    {isOwner && <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPagos.length === 0 ? (
                    <tr><td colSpan={6} className="p-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">No hay registros para los filtros seleccionados</td></tr>
                  ) : (
                    filteredPagos.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-8 py-5">
                          <div className="font-black text-slate-900 uppercase tracking-tight">{p.nombreSocio}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rival: {p.rival || 'N/A'}</div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">{p.categoria}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500">
                            <Calendar size={14} className="text-primary" />
                            <span>{p.fecha}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${p.tipo === 'LOCAL' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {p.tipo}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="font-black text-secondary">${p.monto.toLocaleString()}</div>
                        </td>
                        {isOwner && (
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => handleDeletePago(p.id)} className="p-2 text-slate-300 hover:text-red-600 bg-white border border-slate-100 rounded-xl transition-all"><Trash2 size={16} /></button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isModalOpen && isOwner && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => { setIsModalOpen(false); setEditingFecha(null); }}
        >
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-fade-in relative flex flex-col max-h-[95vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-[2.5rem] shrink-0">
              <div>
                <h3 className="text-xl font-bold text-secondary">{editingFecha?.id ? 'Editar Fecha' : 'Nueva Fecha de Liga'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Competición Oficial</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingFecha(null); }} className="text-slate-400 hover:text-slate-600 p-2 transition-colors cursor-pointer"><X size={24} /></button>
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

      {isPaymentModalOpen && isOwner && selectedSocio && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => { setIsPaymentModalOpen(false); setSelectedSocio(null); }}
        >
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-fade-in relative flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-[2.5rem] shrink-0">
              <div>
                <h3 className="text-xl font-bold text-secondary">Registrar Arancel</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedSocio.nombre} {selectedSocio.apellido}</p>
              </div>
              <button onClick={() => { setIsPaymentModalOpen(false); setSelectedSocio(null); }} className="text-slate-400 hover:text-slate-600 p-2 transition-colors cursor-pointer"><X size={24} /></button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentData({...paymentData, tipo: 'LOCAL'})}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${paymentData.tipo === 'LOCAL' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}
                  >
                    <Shield size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Local</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentData({...paymentData, tipo: 'VIAJE'})}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${paymentData.tipo === 'VIAJE' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}
                  >
                    <Map size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Viaje</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Monto del Arancel</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      required 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl outline-none focus:border-primary transition-all" 
                      value={paymentData.monto || ''} 
                      onChange={e => setPaymentData({...paymentData, monto: Number(e.target.value)})} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Rival (Opcional)</label>
                  <input 
                    placeholder="Nombre del Rival" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" 
                    value={paymentData.rival} 
                    onChange={e => setPaymentData({...paymentData, rival: e.target.value.toUpperCase()})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha del Partido</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-primary transition-all text-sm" 
                    value={paymentData.fecha} 
                    onChange={e => setPaymentData({...paymentData, fecha: e.target.value})} 
                  />
                </div>

                <button type="submit" disabled={processing} className="w-full bg-primary text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 mt-2 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all">
                  {processing ? <Loader2 className="animate-spin" size={18} /> : <span>REGISTRAR PAGO</span>}
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
