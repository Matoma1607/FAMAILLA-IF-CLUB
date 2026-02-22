
import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Search, Plus, Loader2, X, Trash2, Edit2, DollarSign, Wallet, ArrowRightLeft
} from 'lucide-react';
import { getPagos, getSocios, registrarPago, updateEstadoPago, deletePago } from '../services/dataService';
import { Pago, Socio } from '../types';

const Pagos = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPago, setEditingPago] = useState<Partial<Pago> & { selectedMeses?: string[] } | null>(null);
  const [isMultiMonth, setIsMultiMonth] = useState(false);
  const [filterMetodo, setFilterMetodo] = useState<'TODOS' | 'EFECTIVO' | 'TRANSFERENCIA'>('TODOS');
  const [viewMode, setViewMode] = useState<'AGRUPADO' | 'DETALLADO'>('AGRUPADO');

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const now = new Date();
  const mesActual = meses[now.getMonth()];
  const anioActual = now.getFullYear();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getPagos(), getSocios()]);
      setPagos(p || []);
      setSocios(s || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPago?.socioId) return;
    
    const socio = socios.find(s => String(s.id) === String(editingPago.socioId));
    const nombreSocio = socio ? `${socio.nombre} ${socio.apellido}` : '';
    
    setProcessing(true);
    try {
      if (isMultiMonth && editingPago.selectedMeses && editingPago.selectedMeses.length > 0) {
        const montoPorMes = (Number(editingPago.monto) || 0) / editingPago.selectedMeses.length;
        const promises = editingPago.selectedMeses.map(m => 
          registrarPago({
            ...editingPago,
            nombreSocio,
            mes: m,
            monto: montoPorMes,
            nota: `${editingPago.nota || 'Cuota'} (${editingPago.selectedMeses?.join(', ')})`
          })
        );
        await Promise.all(promises);
      } else {
        await registrarPago({ ...editingPago, nombreSocio });
      }
      setIsModalOpen(false);
      setEditingPago(null);
      setIsMultiMonth(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const togglePago = async (ids: string | string[], current: string) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const next = current === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
    setProcessing(true);
    try {
      await Promise.all(idArray.map(id => updateEstadoPago(id, next)));
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (ids: string | string[]) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    if (window.confirm(`¿Confirmas la eliminación de ${idArray.length > 1 ? 'estos registros' : 'este registro'}?`)) {
      setProcessing(true);
      try {
        await Promise.all(idArray.map(id => deletePago(id)));
        fetchData();
      } catch (err) {
        console.error(err);
      } finally {
        setProcessing(false);
      }
    }
  };

  const getProcessedPagos = () => {
    const filtered = pagos.filter(p => {
      const socio = socios.find(s => String(s.id).trim() === String(p.socioId).trim());
      const term = searchTerm.toLowerCase();
      if (filterMetodo !== 'TODOS' && p.metodo !== filterMetodo) return false;
      if (!term) return true;
      if (!socio) return false;
      return `${socio.nombre} ${socio.apellido}`.toLowerCase().includes(term);
    });

    if (viewMode === 'DETALLADO') return filtered.map(p => ({ ...p, ids: [p.id], displayMes: p.mes }));

    // Lógica de Agrupación Inteligente
    const groups: { [key: string]: any } = {};
    filtered.forEach(p => {
      // Agrupamos por Socio + Año para consolidar meses y conceptos
      const key = `${p.socioId}-${p.anio}`;
      if (!groups[key]) {
        groups[key] = {
          ...p,
          ids: [p.id],
          montoTotal: Number(p.monto),
          notas: p.nota ? [p.nota] : [],
          mesesList: [p.mes],
          estados: [p.estado]
        };
      } else {
        groups[key].ids.push(p.id);
        const normalizedNota = p.nota ? p.nota.trim().toUpperCase() : '';
        if (normalizedNota && !groups[key].notas.some((n: string) => n.trim().toUpperCase() === normalizedNota)) {
          groups[key].notas.push(p.nota);
        }
        if (!groups[key].mesesList.includes(p.mes)) groups[key].mesesList.push(p.mes);
        if (!groups[key].estados.includes(p.estado)) groups[key].estados.push(p.estado);
        groups[key].montoTotal += Number(p.monto);
        // Si alguno es transferencia, marcamos el grupo como tal para visibilidad
        if (p.metodo === 'TRANSFERENCIA') groups[key].metodo = 'TRANSFERENCIA';
      }
    });

    return Object.values(groups).map(g => {
      // Ordenar meses cronológicamente
      const sortedMeses = [...g.mesesList].sort((a, b) => meses.indexOf(a) - meses.indexOf(b));
      
      // Estado inteligente: si debe algo (PENDIENTE), el grupo se marca como PENDIENTE
      const finalEstado = g.estados.includes('PENDIENTE') ? 'PENDIENTE' : 'PAGADO';

      // Formatear meses: si son varios, mostrar rango o lista
      let displayMes = sortedMeses[0];
      if (sortedMeses.length > 1) {
        const isConsecutive = sortedMeses.every((m, i) => {
          if (i === 0) return true;
          return meses.indexOf(m) === meses.indexOf(sortedMeses[i-1]) + 1;
        });
        displayMes = isConsecutive 
          ? `${sortedMeses[0].slice(0,3)} - ${sortedMeses[sortedMeses.length-1].slice(0,3)}`
          : sortedMeses.map(m => m.slice(0,3)).join(', ');
      }

      return {
        ...g,
        monto: g.montoTotal,
        estado: finalEstado,
        nota: g.notas.length > 0 ? g.notas.join(' + ') : 'Cuota Mensual',
        displayMes
      };
    });
  };

  const processedPagos = getProcessedPagos();

  const totalCaja = pagos.filter(p => p.estado === 'PAGADO').reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const totalEfectivo = pagos.filter(p => p.estado === 'PAGADO' && String(p.metodo).trim().toUpperCase() === 'EFECTIVO').reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const totalTransferencia = pagos.filter(p => p.estado === 'PAGADO' && String(p.metodo).trim().toUpperCase() === 'TRANSFERENCIA').reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Finanzas</h2>
          <p className="text-slate-500">Control de cuotas y cobros de FAMAILLA IF.</p>
        </div>
        <button 
          onClick={() => { 
            setEditingPago({ mes: mesActual, anio: anioActual, monto: 8500, estado: 'PAGADO', metodo: 'EFECTIVO', selectedMeses: [mesActual] }); 
            setIsMultiMonth(false);
            setIsModalOpen(true); 
          }} 
          className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center space-x-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Nuevo Cobro</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setFilterMetodo('TODOS')}
          className={`p-6 rounded-2xl border transition-all text-left ${filterMetodo === 'TODOS' ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20' : 'bg-white border-slate-100 shadow-sm hover:border-emerald-200'}`}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg ${filterMetodo === 'TODOS' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}><DollarSign size={20} /></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Caja Total</span>
          </div>
          <p className="text-2xl font-black text-secondary">${totalCaja.toLocaleString()}</p>
        </button>

        <button 
          onClick={() => setFilterMetodo('EFECTIVO')}
          className={`p-6 rounded-2xl border transition-all text-left ${filterMetodo === 'EFECTIVO' ? 'bg-primary/5 border-primary/20 ring-2 ring-primary/20' : 'bg-white border-slate-100 shadow-sm hover:border-primary/20'}`}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg ${filterMetodo === 'EFECTIVO' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}><Wallet size={20} /></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Efectivo</span>
          </div>
          <p className="text-2xl font-black text-secondary">${totalEfectivo.toLocaleString()}</p>
        </button>

        <button 
          onClick={() => setFilterMetodo('TRANSFERENCIA')}
          className={`p-6 rounded-2xl border transition-all text-left ${filterMetodo === 'TRANSFERENCIA' ? 'bg-secondary/5 border-secondary/20 ring-2 ring-secondary/20' : 'bg-white border-slate-100 shadow-sm hover:border-secondary/20'}`}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg ${filterMetodo === 'TRANSFERENCIA' ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-400'}`}><ArrowRightLeft size={20} /></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Transferencia</span>
          </div>
          <p className="text-2xl font-black text-secondary">${totalTransferencia.toLocaleString()}</p>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar alumno..." 
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium focus:ring-2 focus:ring-primary/10" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          {filterMetodo !== 'TODOS' && (
            <button 
              onClick={() => setFilterMetodo('TODOS')}
              className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full flex items-center space-x-2"
            >
              <span>Filtrado por: {filterMetodo}</span>
              <X size={14} />
            </button>
          )}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('AGRUPADO')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'AGRUPADO' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
            >
              Agrupado
            </button>
            <button 
              onClick={() => setViewMode('DETALLADO')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'DETALLADO' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
            >
              Detalle
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Alumno</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Concepto</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Período</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Monto</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Método</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center">Estado</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="animate-spin inline text-primary mr-2" /> <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando registros...</span></td></tr>
              ) : processedPagos.length === 0 ? (
                <tr><td colSpan={7} className="p-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest italic">No se encontraron registros de pago</td></tr>
              ) : processedPagos.map((p: any) => {
                const socio = socios.find(s => String(s.id) === String(p.socioId));
                return (
                  <tr key={p.ids.join('-')} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900">
                      {socio ? `${socio.nombre} ${socio.apellido}` : (p.nombreSocio || `ID: ${p.socioId}`)}
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-[10px] font-black text-primary uppercase tracking-widest">
                        {p.nota || 'Cuota Mensual'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-slate-100 inline-block px-2 py-1 rounded-lg">
                        {p.displayMes} {p.anio}
                      </div>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-900 text-lg tracking-tighter">
                      ${Math.round(Number(p.monto)).toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${p.metodo === 'TRANSFERENCIA' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {p.metodo || 'S/D'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => togglePago(p.ids, p.estado)} 
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm hover:scale-105 active:scale-95 border ${
                          p.estado === 'PAGADO' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}
                      >
                        {p.estado}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end space-x-1">
                        {p.ids.length === 1 && (
                          <button onClick={() => { setEditingPago(p); setIsModalOpen(true); }} className="p-2.5 text-slate-300 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"><Edit2 size={16} /></button>
                        )}
                        <button onClick={() => handleDelete(p.ids)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"><Trash2 size={16} /></button>
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
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 my-auto animate-fade-in relative">
            <div className="flex justify-between items-center mb-8">
               <div>
                 <h3 className="text-xl font-bold text-secondary">{editingPago?.id ? 'Editar Cobro' : 'Registrar Cobro'}</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tesorería Famaillá IF</p>
               </div>
               <button onClick={() => { setIsModalOpen(false); setEditingPago(null); setIsMultiMonth(false); }} className="text-slate-300 hover:text-slate-600 p-2 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              {!editingPago?.id && (
                <div className="flex items-center space-x-2 mb-4">
                  <input 
                    type="checkbox" 
                    id="multiMonth" 
                    checked={isMultiMonth} 
                    onChange={(e) => {
                      setIsMultiMonth(e.target.checked);
                      if (e.target.checked) {
                        setEditingPago(prev => ({ ...prev, selectedMeses: [prev?.mes || mesActual] }));
                      }
                    }}
                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                  />
                  <label htmlFor="multiMonth" className="text-xs font-bold text-slate-600 uppercase tracking-widest cursor-pointer">Cobrar varios meses</label>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Alumno</label>
                <select 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-primary transition-all appearance-none" 
                  value={editingPago?.socioId || ""} 
                  onChange={e => setEditingPago({...editingPago, socioId: e.target.value})}
                >
                  <option value="">Seleccionar Alumno...</option>
                  {socios.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Concepto / Nota</label>
                <input 
                  type="text" 
                  placeholder="Ej: Cuota Marzo, Inscripción, Ropa..." 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-primary transition-all" 
                  value={editingPago?.nota || ""} 
                  onChange={e => setEditingPago({...editingPago, nota: e.target.value})} 
                />
              </div>

              {isMultiMonth ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Seleccionar Meses</label>
                  <div className="grid grid-cols-3 gap-2">
                    {meses.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          const current = editingPago?.selectedMeses || [];
                          const next = current.includes(m) 
                            ? current.filter(x => x !== m)
                            : [...current, m];
                          setEditingPago({ ...editingPago, selectedMeses: next });
                        }}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          editingPago?.selectedMeses?.includes(m)
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {m.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mes</label>
                    <select 
                      required 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none appearance-none" 
                      value={editingPago?.mes || ""} 
                      onChange={e => setEditingPago({...editingPago, mes: e.target.value})}
                    >
                      {meses.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Año</label>
                    <input 
                      type="number" 
                      required 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" 
                      value={editingPago?.anio || anioActual} 
                      onChange={e => setEditingPago({...editingPago, anio: Number(e.target.value)})} 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  {isMultiMonth ? 'Monto Total por todos los meses ($)' : 'Monto ($)'}
                </label>
                <input 
                  type="number" 
                  required 
                  placeholder={isMultiMonth ? "25500" : "8500"} 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-lg outline-none focus:border-primary transition-all" 
                  value={editingPago?.monto || ""} 
                  onChange={e => setEditingPago({...editingPago, monto: Number(e.target.value)})} 
                />
                {isMultiMonth && editingPago?.selectedMeses && editingPago.selectedMeses.length > 0 && (
                  <p className="text-[10px] font-bold text-slate-400 mt-1 italic">
                    Se crearán {editingPago.selectedMeses.length} registros de ${(Number(editingPago.monto || 0) / editingPago.selectedMeses.length).toFixed(0)} cada uno.
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Método de Pago</label>
                <select 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none appearance-none" 
                  value={editingPago?.metodo || "EFECTIVO"} 
                  onChange={e => setEditingPago({...editingPago, metodo: e.target.value as any})}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-center block">Estado Inicial</label>
                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setEditingPago({...editingPago, estado: 'PAGADO'})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${editingPago?.estado === 'PAGADO' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                  >
                    Pagado
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingPago({...editingPago, estado: 'PENDIENTE'})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${editingPago?.estado === 'PENDIENTE' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}
                  >
                    Pendiente
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={processing} 
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 mt-6 flex items-center justify-center space-x-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {processing ? <Loader2 className="animate-spin" size={20} /> : <span>GUARDAR REGISTRO</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
