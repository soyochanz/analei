/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarDays, 
  Clock, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Bell, 
  Sparkles,
  HelpCircle,
  Plus,
  Users,
  Percent,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Mail,
  Smartphone,
  Check,
  ChevronDown,
  Coins,
  Shield,
  FileBarChart
} from 'lucide-react';
import { ADMIN_AVATAR } from '../data';

interface FreshaSimulationViewProps {
  onBackToClient: () => void;
  onEnterCustomAdmin: () => void;
}

interface EventBlock {
  id: string;
  client: string;
  treatment: string;
  timeLabel: string;
  durationMins: number;
  rowOffset: number; // 0 matches 8:00 AM, each unit is 30 mins
  rowSpan: number; // in units of 30 mins (2 spans 1 hour)
  staffId: 'john' | 'maria' | 'wendy' | 'amy' | 'michael';
  colorCombo: string; // Tailwind bg and text styles
  status: 'confirmed' | 'pending-pay';
}

export default function FreshaSimulationView({
  onBackToClient,
  onEnterCustomAdmin
}: FreshaSimulationViewProps) {
  // Configured interactive states
  const [activeTab, setActiveTab] = useState<'calendar' | 'analytics' | 'noshows' | 'pricing'>('calendar');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showNoShowProtectionPreview, setShowNoShowProtectionPreview] = useState(false);
  const [showPaymentLinkSimulation, setShowPaymentLinkSimulation] = useState(false);
  const [simulatedPriceSum, setSimulatedPriceSum] = useState<number>(350);

  // Replicating staff from the Fresha dashboard image
  const staffMembers = [
    { id: 'john', name: 'John', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop' },
    { id: 'maria', name: 'Maria', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop' },
    { id: 'wendy', name: 'Wendy', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop' },
    { id: 'amy', name: 'Amy', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop' },
    { id: 'michael', name: 'Michael', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop' }
  ] as const;

  // Replicating precisely the event blocks layout visible in the user's second image
  const initialEvents: EventBlock[] = [
    {
      id: 'e1',
      client: 'Brenda Massey',
      treatment: 'Blow Dry',
      timeLabel: '8:00 - 9:00',
      durationMins: 60,
      rowOffset: 0, // Starts at 8:00 AM
      rowSpan: 2, // 1 hour
      staffId: 'john',
      colorCombo: 'bg-cyan-150 border-l-4 border-cyan-500 text-cyan-850',
      status: 'confirmed'
    },
    {
      id: 'e2',
      client: 'Craig Mango',
      treatment: 'Yoga session',
      timeLabel: '10:00 - 10:35',
      durationMins: 35,
      rowOffset: 4, // Starts at 10:00 AM
      rowSpan: 2, // rounded representing some overlap
      staffId: 'john',
      colorCombo: 'bg-pink-100 border-l-4 border-pink-500 text-pink-800',
      status: 'confirmed'
    },
    {
      id: 'e3',
      client: 'Zain Dias',
      treatment: 'Hair Coloring',
      timeLabel: '11:00 - 12:00',
      durationMins: 60,
      rowOffset: 6, // Starts at 11:00 AM
      rowSpan: 2,
      staffId: 'john',
      colorCombo: 'bg-amber-100 border-l-4 border-amber-500 text-amber-800',
      status: 'confirmed'
    },
    {
      id: 'e4',
      client: 'Mary Lee Fisher',
      treatment: 'Hair Coloring',
      timeLabel: '1:15 - 2:30',
      durationMins: 75,
      rowOffset: 10, // 1:15 is approx rowOffset 10.5
      rowSpan: 3,
      staffId: 'john',
      colorCombo: 'bg-sky-100 border-l-4 border-sky-450 text-sky-850',
      status: 'confirmed'
    },
    {
      id: 'e5',
      client: 'Alena Geidt',
      treatment: 'Hair cut',
      timeLabel: '8:00 - 9:00',
      durationMins: 60,
      rowOffset: 0,
      rowSpan: 2,
      staffId: 'maria',
      colorCombo: 'bg-orange-100 border-l-4 border-orange-500 text-orange-850',
      status: 'confirmed'
    },
    {
      id: 'e6',
      client: 'Marilyn Carder',
      treatment: 'Hair and Beard Cut',
      timeLabel: '10:00 - 10:35',
      durationMins: 35,
      rowOffset: 4,
      rowSpan: 2,
      staffId: 'maria',
      colorCombo: 'bg-teal-100 border-l-4 border-teal-500 text-teal-800',
      status: 'confirmed'
    },
    {
      id: 'e7',
      client: 'Phillip Dorwart',
      treatment: 'Beard Grooming',
      timeLabel: '9:00 - 10:15',
      durationMins: 75,
      rowOffset: 2, // Starts at 9:00 AM
      rowSpan: 3,
      staffId: 'wendy',
      colorCombo: 'bg-purple-100 border-l-4 border-purple-400 text-purple-800',
      status: 'confirmed'
    },
    {
      id: 'e8',
      client: 'Desirae Stanton',
      treatment: 'Blow Dry',
      timeLabel: '12:15 - 1:30',
      durationMins: 75,
      rowOffset: 8, // Starts at 12:00 PM (technically 12:15 PM)
      rowSpan: 3,
      staffId: 'wendy',
      colorCombo: 'bg-sky-100 border-l-4 border-sky-450 text-sky-850',
      status: 'confirmed'
    },
    {
      id: 'e9',
      client: 'Alena Dias',
      treatment: 'Haircut and colour',
      timeLabel: '12:15 - 1:30',
      durationMins: 75,
      rowOffset: 8,
      rowSpan: 3,
      staffId: 'maria', // Replicated next to Wendy on row 12:15
      colorCombo: 'bg-orange-100 border-l-4 border-orange-500 text-orange-850',
      status: 'confirmed'
    },
    {
      id: 'e10',
      client: 'James Herwitz',
      treatment: 'Balinese Massage',
      timeLabel: '8:30 - 9:45',
      durationMins: 75,
      rowOffset: 1, // Starts at 8:30 AM
      rowSpan: 3,
      staffId: 'amy',
      colorCombo: 'bg-teal-100 border-l-4 border-teal-500 text-teal-800',
      status: 'confirmed'
    },
    {
      id: 'e11',
      client: 'Amy Jones',
      treatment: 'Haircut and colour',
      timeLabel: '9:45 - 11:15',
      durationMins: 90,
      rowOffset: 3, // Starts at 9:30 AM (approx 9:45)
      rowSpan: 3,
      staffId: 'amy',
      colorCombo: 'bg-sky-100 border-l-4 border-sky-400 text-sky-850',
      status: 'confirmed'
    },
    {
      id: 'e12',
      client: 'Megan White',
      treatment: 'Hair cut',
      timeLabel: '9:00 - 10:15',
      durationMins: 75,
      rowOffset: 2,
      rowSpan: 3,
      staffId: 'michael',
      colorCombo: 'bg-orange-100 border-l-4 border-orange-400 text-orange-800',
      status: 'confirmed'
    },
    {
      id: 'e13',
      client: 'Randy Press',
      treatment: 'Swedish Massage',
      timeLabel: '11:15 - 12:30',
      durationMins: 75,
      rowOffset: 6,
      rowSpan: 3,
      staffId: 'michael',
      colorCombo: 'bg-pink-100 border-l-4 border-pink-400 text-pink-800',
      status: 'confirmed'
    }
  ];

  const [simulationEvents, setSimulationEvents] = useState<EventBlock[]>(initialEvents);

  // Hours side bar configuration (10 time gaps, representing half-hour intervals from 8:00 AM)
  const timeLabels = [
    { hour: '8:00', period: 'am' },
    { hour: '9:00', period: 'am' },
    { hour: '10:00', period: 'am' },
    { hour: '11:00', period: 'am' },
    { hour: '12:00', period: 'pm' },
    { hour: '1:00', period: 'pm' },
    { hour: '2:00', period: 'pm' },
    { hour: '3:00', period: 'pm' }
  ];

  const handleCreateSimulatedEvent = () => {
    const extraEvent: EventBlock = {
      id: `e-custom-${Date.now()}`,
      client: 'Carmen Soler',
      treatment: 'Balayage & Glow',
      timeLabel: '10:00 - 11:30',
      durationMins: 90,
      rowOffset: 4, // 10 AM
      rowSpan: 3,
      staffId: 'wendy',
      colorCombo: 'bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800',
      status: 'confirmed'
    };
    
    // Check if overlap exists on wendy
    if (simulationEvents.some(e => e.staffId === 'wendy' && e.id === 'e-custom-1')) {
      alert('Esta cita ya ha sido insertada de forma interactiva en la agenda.');
      return;
    }
    
    setSimulationEvents(prev => [...prev.filter(ev => !ev.id.startsWith('e-custom')), extraEvent]);
    setSelectedEventId(extraEvent.id);
    alert('Simulación: Se ha generado una cita interactiva para "Carmen Soler" en el calendario de Wendy.');
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] text-stone-800 antialiased font-sans relative flex flex-col justify-between">
      
      {/* Top Banner indicating prototype */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-[#ec4899] text-white py-2.5 px-6 shrink-0 flex flex-wrap justify-between items-center z-20 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold font-sans">
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase">Fresha Engine Simulation</span>
          <span>Demostración de propuesta premium con pasarela externa.</span>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={onEnterCustomAdmin}
            className="bg-white text-stone-900 border border-transparent hover:bg-rose-50 px-3.5 py-1 rounded-full text-[10.5px] font-bold shadow-sm transition-all cursor-pointer"
          >
            Ver Menú Propio (Sin Costes)
          </button>
          <button
            onClick={onBackToClient}
            className="text-xs font-bold text-white hover:underline flex items-center gap-1 cursor-pointer"
          >
            Volver a la Web <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-7.5xl mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* Left Control and explanation Panel */}
        <section className="lg:w-80 shrink-0 flex flex-col gap-6">
          
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col gap-4">
            <div className="flex gap-2 items-center text-purple-700">
              <CalendarDays className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider font-sans">Control del Motor</span>
            </div>
            
            <h3 className="font-serif text-2xl font-bold text-stone-900 leading-tight">
              ¿Por qué elegir Fresha?
            </h3>
            
            <p className="text-xs text-stone-500 leading-relaxed">
              Fresha es un motor externo automatizado ideal para reducir huecos vacíos y no-shows cobrando fianzas por adelantado.
            </p>

            <nav className="flex flex-col gap-1.5 mt-2">
              <button
                onClick={() => { setActiveTab('calendar'); setSelectedEventId(null); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'calendar' 
                    ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' 
                    : 'hover:bg-stone-50 text-stone-600'
                }`}
              >
                <span>Agenda Táctil</span>
                <span className="text-[10px] text-purple-400 font-mono">Día Activo</span>
              </button>
              
              <button
                onClick={() => { setActiveTab('noshows'); setShowNoShowProtectionPreview(true); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'noshows' 
                    ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' 
                    : 'hover:bg-stone-50 text-stone-600'
                }`}
              >
                <span>No-Show Protection</span>
                <span className="bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">Garantizado</span>
              </button>

              <button
                onClick={() => { setActiveTab('analytics'); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'analytics' 
                    ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' 
                    : 'hover:bg-stone-50 text-stone-600'
                }`}
              >
                <span>Analíticas y KPIs</span>
                <span className="bg-cyan-150 text-cyan-800 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">Gráficos</span>
              </button>

              <button
                onClick={() => { setActiveTab('pricing'); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'pricing' 
                    ? 'bg-pink-50 text-pink-700 border-l-4 border-[#ec4899]' 
                    : 'hover:bg-stone-50 text-stone-600'
                }`}
              >
                <span>Comisiones vs Menú Propio</span>
                <span className="bg-[#ec4899]/10 text-[#ec4899] font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">Diferencias</span>
              </button>
            </nav>
          </div>

          {/* Educational Explainer Block - Clarifying In-Person vs Online Commissions */}
          <div className="bg-purple-50/70 rounded-3xl p-5 border border-purple-100/80 shadow-sm flex flex-col gap-3.5">
            <div className="flex gap-2 items-center text-purple-800">
              <CreditCard className="w-4 h-4 shrink-0 text-purple-600" />
              <h4 className="font-bold text-[11px] uppercase tracking-wider font-sans">Gestión de Cobros y Comisiones</h4>
            </div>
            
            <p className="text-[11.5px] text-stone-600 leading-relaxed font-sans">
              Es importante entender que con <b>Fresha</b> los pagos realizados de forma online tienen comisión por transacción. Sin embargo, <b>se pueden registrar todos los pagos en persona de forma 100% gratuita</b>.
            </p>

            <div className="bg-white/95 rounded-2xl p-4 border border-purple-100/60 shadow-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 animate-pulse" />
                <div>
                  <p className="text-[11px] font-bold text-stone-800">Pagos Online (Pasarela)</p>
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    Sujeto a comisión de pasarela del 1.29% para asegurar depósitos preventivos de no-shows.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2.5 border-t border-purple-50/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <div>
                  <p className="text-[11px] font-bold text-stone-800 flex items-center gap-1">
                    <span>Pagos en Persona (Efectivo/TPV de María)</span>
                    <span className="bg-emerald-50 text-emerald-700 text-[8px] px-1.5 py-0.2 rounded-full font-sans font-bold uppercase tracking-wider">Gratis</span>
                  </p>
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    Registra citas de forma manual en la agenda táctil sin costes extras a modo de control de caja, auditoría diaria, cuadre y gestión de inventario.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Action CTA */}
          <button
            onClick={handleCreateSimulatedEvent}
            className="w-full py-3.5 bg-gradient-to-r from-purple-700 to-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all text-center cursor-pointer shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Insertar Cita dePrueba
          </button>

        </section>

        {/* Right Stage: Large Dashboard Simulator Frame */}
        <section className="flex-1 select-none">
          
          <AnimatePresence mode="wait">
            {activeTab === 'calendar' && (
              <motion.div
                key="calendar-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-[2rem] border border-stone-200 shadow-xl overflow-hidden flex flex-col h-full min-h-[640px]"
              >
                {/* Simulated Fresha Header */}
                <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-white/5 shrink-0 select-none">
                  <div className="flex items-center gap-4">
                    <span className="font-serif text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                      <span className="text-[#f472b6]">fresha</span>
                    </span>
                    
                    <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 gap-2 w-52 text-xs text-stone-400">
                      <Search className="w-3.5 h-3.5" />
                      <span>Buscar cita o cliente...</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative cursor-pointer">
                      <Bell className="w-5 h-5 text-stone-300 animate-pulse" />
                      <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full border-2 border-slate-900" />
                    </div>
                    <div className="flex items-center gap-2">
                      <img 
                        src={ADMIN_AVATAR} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full border border-white/20" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs text-white font-bold hidden sm:inline">María Admin</span>
                    </div>
                  </div>
                </header>

                {/* SubHeader Filters Row */}
                <div className="bg-white border-b border-stone-200 px-6 py-3.5 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <button className="px-3.5 py-1.5 bg-[#f3f4f6] rounded-lg text-xs font-bold text-stone-800">
                      Today
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-stone-100 rounded text-stone-600">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-stone-800 font-sans mx-1">Wednesday 21 Jun</span>
                      <button className="p-1 hover:bg-stone-100 rounded text-stone-600">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="h-4 w-px bg-stone-200 hidden sm:block" />

                    <button className="text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                      <span>Trendy salon</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 hidden xl:inline font-semibold">Scheduled team: 5</span>
                    <button className="p-1.5 bg-[#7c3aed]/10 text-[#7c3aed] font-bold text-xs rounded-lg px-3 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Equipo
                    </button>
                    <button className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                      Add <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Simulated Calendar Columns Grid Area */}
                <div className="flex-1 overflow-x-auto min-w-[700px]">
                  
                  {/* Grid Column Headers: Staff Columns */}
                  <div className="grid grid-cols-11 border-b border-stone-200 text-center sticky top-0 bg-white z-10">
                    <div className="col-span-1 border-r border-stone-200 py-3 text-[10px] uppercase text-stone-400 font-bold select-none h-fit">
                      Time
                    </div>
                    
                    {/* Maps our 5 main staff columns (2 cols span each) */}
                    {staffMembers.map((staff) => (
                      <div 
                        key={staff.id} 
                        className="col-span-2 border-r border-[#eaebed] py-2 flex flex-col items-center justify-center gap-1.5"
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-purple-200 relative">
                          <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-stone-850">{staff.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calendar Matrix Content Area */}
                  <div className="relative pb-10 flex select-none">
                    
                    {/* Absolute Back Grid horizontal helper lines */}
                    <div className="absolute inset-0 z-0 pointer-events-none flex flex-col select-none">
                      {Array.from({ length: 15 }).map((_, index) => (
                        <div key={index} className="h-14 border-b border-[#f1f2f4]" />
                      ))}
                    </div>

                    {/* Left side Hours timeline column */}
                    <div className="w-[9.09%] shrink-0 z-10 bg-white/90 mr-[0.1%] text-center select-none">
                      {timeLabels.map((time, idx) => (
                        <div key={idx} className="h-28 flex flex-col justify-start pt-1.5 border-r border-stone-200 select-none">
                          <span className="text-xs font-extrabold text-stone-800">{time.hour}</span>
                          <span className="text-[9px] text-stone-400 font-bold uppercase">{time.period}</span>
                        </div>
                      ))}
                    </div>

                    {/* Columns representing staff calendar lines */}
                    <div className="flex-1 grid grid-cols-10 relative z-10 select-none">
                      
                      {/* Generates placeholder boxes / empty slots representing real agenda tiles */}
                      {staffMembers.map((staff, staffIdx) => {
                        const matchedEvents = simulationEvents.filter(e => e.staffId === staff.id);

                        return (
                          <div 
                            key={staff.id} 
                            className="col-span-2 border-r border-[#f1f2f4] relative min-h-[448px]"
                          >
                            {/* Empty background grid action blocks hoverable */}
                            {Array.from({ length: 16 }).map((_, slotIdx) => (
                              <button 
                                key={slotIdx}
                                onClick={() => {
                                  alert(`Click detected on ${staff.name}'s slot at ${8 + Math.floor(slotIdx/2)}:${slotIdx % 2 === 0 ? '00' : '30'}. En el software real, esto abre el creador instantáneo.`);
                                }}
                                className="absolute w-full h-7 border-b border-dotted border-stone-100 hover:bg-purple-500/5 cursor-pointer"
                                style={{ top: `${slotIdx * 28}px` }}
                              />
                            ))}

                            {/* Actual rendered reservation block overlay */}
                            {matchedEvents.map((ev) => {
                              const isSelected = selectedEventId === ev.id;
                              
                              return (
                                <motion.div
                                  key={ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEventId(ev.id);
                                  }}
                                  whileHover={{ scale: 1.01, zIndex: 12 }}
                                  className={`absolute left-1 right-1 rounded-xl p-2.5 shadow-sm text-left flex flex-col justify-between transition-all select-none cursor-pointer ${ev.colorCombo} ${
                                    isSelected ? 'ring-2 ring-purple-600 scale-102 shadow-md z-20' : 'z-10'
                                  }`}
                                  style={{
                                    top: `${ev.rowOffset * 28 + 3}px`,
                                    height: `${ev.rowSpan * 28 - 6}px`
                                  }}
                                >
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono tracking-tight font-extrabold block truncate">
                                        {ev.timeLabel}
                                      </span>
                                      {ev.status === 'confirmed' && (
                                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                      )}
                                    </div>
                                    <span className="text-[11px] font-extrabold max-w-full block truncate mt-0.5">
                                      {ev.client}
                                    </span>
                                  </div>
                                  
                                  <span className="text-[9.5px] opacity-90 block truncate leading-none">
                                    {ev.treatment}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        );
                      })}

                    </div>

                  </div>
                </div>

                {/* Calendar Active Event Inspector mini bottom bar */}
                <AnimatePresence>
                  {selectedEventId && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 30 }}
                      className="bg-purple-900 text-white px-6 py-4 border-t border-purple-800 z-20 flex flex-wrap justify-between items-center gap-3 shrink-0"
                    >
                      {(() => {
                        const activeEvent = simulationEvents.find(e => e.id === selectedEventId);
                        if (!activeEvent) return null;
                        return (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                {activeEvent.client.split(' ').map(p=>p[0]).join('')}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{activeEvent.client}</p>
                                <p className="text-xs text-purple-200">
                                  {activeEvent.treatment} &bull; {activeEvent.timeLabel} con <b>{activeEvent.staffId[0].toUpperCase() + activeEvent.staffId.slice(1)}</b>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                                Confirmada por App
                              </span>
                              <button
                                onClick={() => {
                                  setShowPaymentLinkSimulation(true);
                                  alert(`Interactivo: Enviando cargo No-Show simulado para ${activeEvent.client}`);
                                }}
                                className="bg-white text-purple-900 hover:bg-stone-50 text-xs font-bold px-4 py-2 rounded-xl transition-all select-none cursor-pointer"
                              >
                                Forzar Cobro No-Show Protect
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}

            {activeTab === 'noshows' && (
              <motion.div
                key="noshow-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-[2rem] border border-stone-200 shadow-xl p-8 h-full min-h-[640px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-3 py-1 rounded-full border border-orange-100 uppercase tracking-widest">
                        Evita Citas Fantasma
                      </span>
                      <h3 className="font-serif text-3xl font-bold text-stone-900 mt-2">
                        Fianza Contra Cancelaciones Tarde
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Protege el horario del salón de María de forma robusta con la pasarela de Fresha.
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-100">
                      <Shield className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    
                    {/* Simulation scenario phone preview left */}
                    <div className="bg-[#18181b] rounded-[2.5rem] p-4 border-8 border-stone-800 shadow-2xl relative max-w-sm mx-auto w-full flex flex-col gap-4 text-white">
                      
                      <div className="w-32 h-6 bg-stone-800 rounded-b-2xl mx-auto absolute top-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-1.5 z-10">
                        <span className="w-3 h-3 bg-stone-900 rounded-full" />
                        <span className="w-8 h-1 bg-stone-900 rounded-full" />
                      </div>

                      <div className="pt-6 px-2 flex-grow flex flex-col justify-between min-h-[360px]">
                        <div>
                          <div className="flex justify-between items-center text-[10px] text-stone-400 pt-2 mb-4">
                            <span>12:35</span>
                            <span className="text-[#da4d73] font-bold">fresha.com</span>
                          </div>

                          <span className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mb-3">
                            <Sparkles className="w-5 h-5 text-white" />
                          </span>

                          <h4 className="font-serif text-lg font-bold">Peluquería María</h4>
                          <p className="text-[10px] text-stone-300 mt-1">
                            Para confirmar tu cita de <b>Balayage & Cut</b> con María, es necesario añadir un método de pago de garantía.
                          </p>

                          <div className="bg-white/5 rounded-xl p-3 border border-white/10 mt-4 text-xs space-y-2">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-stone-400">Balayage & Cut:</span>
                              <span className="font-bold">€135.00</span>
                            </div>
                            <div className="flex justify-between text-[11px] pt-1.5 border-t border-white/5 text-orange-400">
                              <span>Protección No-Show:</span>
                              <span className="font-bold">Retención €40.00</span>
                            </div>
                          </div>

                          {/* Dummy credit card inputs */}
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-3 text-xs flex gap-2 items-center">
                            <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
                            <span className="text-[11px] text-stone-400 select-none">•••• •••• •••• 4242</span>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={() => {
                              alert('Simulación: Cliente confirma con Stripe/Fresha de forma segura.');
                              setShowNoShowProtectionPreview(true);
                            }}
                            className="w-full bg-[#f472b6] text-stone-950 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider block text-center cursor-pointer shadow-lg hover:bg-pink-400"
                          >
                            Autorizar fianza de seguridad
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory notes right */}
                    <div className="flex flex-col justify-center gap-4">
                      <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 flex gap-3.5">
                        <CheckCircle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-xs text-stone-900 uppercase tracking-widest">¿Cómo funciona?</h5>
                          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                            Al reservar, la pasarela de Fresha captura la tarjeta bancaria del cliente. Si cancela con menos de 24h de antelación o no asiste, se le cobra automáticamente una penalización (fianza configurada de €40 o el 50% de la cita).
                          </p>
                        </div>
                      </div>

                      <div className="bg-cyan-50 rounded-2xl p-5 border border-cyan-150 flex gap-3.5">
                        <TrendingUp className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-xs text-stone-900 uppercase tracking-widest">Estadísticas de impacto</h5>
                          <p className="text-xs text-stone-500 mt-1 leading-relaxed font-semibold">
                            Salones rurales y urbanos demuestran una reducción de no-shows superiores al 85% tras activar esta simple fianza.
                          </p>
                        </div>
                      </div>

                      {showNoShowProtectionPreview && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs"
                        >
                          <p className="font-bold flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
                            Simulación Activa
                          </p>
                          <span>Si el cliente comete un no-show voluntario en el calendario, se te enviará un depósito directo por el importe compensatorio de la fianza.</span>
                        </motion.div>
                      )}
                    </div>

                  </div>
                </div>

                <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-between items-center text-xs shrink-0 rounded-b-[2rem]">
                  <span className="text-stone-500">¿Quieres volver a la agenda interactiva?</span>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="p-2 px-4 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 cursor-pointer"
                  >
                    Volver a la Agenda
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-[2rem] border border-stone-200 shadow-xl p-8 h-full min-h-[640px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="bg-cyan-50 text-cyan-800 text-[10px] font-bold px-3 py-1 rounded-full border border-cyan-150 uppercase tracking-widest">
                        Rendimiento del Salón
                      </span>
                      <h3 className="font-serif text-3xl font-bold text-stone-900 mt-2">
                        Analíticas Avanzadas Fresha
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Controla el volumen de facturación promedio y la fidelización del cliente en tiempo real.
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 border border-cyan-150">
                      <FileBarChart className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Gorgeous mockup charts cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    
                    {/* Stat box 1 */}
                    <div className="bg-[#fcf8fa] rounded-2xl p-5 border border-rose-100 flex flex-col gap-1.5">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Ingresos Totales</span>
                      <p className="text-3xl font-bold text-stone-900 font-serif">€4,680</p>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +15.2% vs mes anterior
                      </span>
                    </div>

                    {/* Stat box 2 */}
                    <div className="bg-[#f8f9ff] rounded-2xl p-5 border border-indigo-100 flex flex-col gap-1.5">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Servicio Estrella</span>
                      <p className="text-xl font-bold text-stone-900">Balayage & Cut</p>
                      <p className="text-xs text-stone-500">Representa el <b>48%</b> de la ocupación del salón.</p>
                    </div>

                    {/* Stat box 3 */}
                    <div className="bg-[#fcfcfa] rounded-2xl p-5 border border-amber-100 flex flex-col gap-1.5">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Tasa de Fidelidad</span>
                      <p className="text-3xl font-bold text-stone-900 font-serif">82%</p>
                      <span className="text-[10px] text-purple-600 font-bold bg-purple-50 w-fit px-2 py-0.5 rounded">
                        Retención Altísima
                      </span>
                    </div>

                  </div>

                  {/* Simulated Visual Graph block bar charts using simple responsive divs */}
                  <div className="bg-stone-50 border border-stone-150 rounded-2.5xl p-6">
                    <h4 className="text-xs font-bold uppercase text-stone-500 mb-6 tracking-wider">Distribución Semanal de Ventas</h4>
                    
                    <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-stone-200 relative px-4">
                      
                      {/* Grid helper lines */}
                      <div className="absolute top-0 inset-x-0 border-t border-dashed border-stone-200" />
                      <div className="absolute top-20 inset-x-0 border-t border-dashed border-stone-200" />

                      <div className="text-[10px] text-stone-400 absolute left-2 top-1 select-none">€1.5k</div>
                      <div className="text-[10px] text-stone-400 absolute left-2 top-20 select-none">€750</div>

                      {[
                        { day: 'Lun', val: 'h-[40%]', revenue: '€600' },
                        { day: 'Mar', val: 'h-[65%]', revenue: '€950' },
                        { day: 'Mié', val: 'h-[78%]', revenue: '€1,120' },
                        { day: 'Jue', val: 'h-[85%]', revenue: '€1,280' },
                        { day: 'Vie', val: 'h-[92%]', revenue: '€1,450' },
                        { day: 'Sáb', val: 'h-[98%]', revenue: '€1,680' }
                      ].map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative z-10 select-none">
                          <span className="absolute -top-7 bg-purple-950 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.revenue}
                          </span>
                          <div className={`w-full max-w-10 bg-purple-600 group-hover:bg-purple-700 transition-all rounded-t-lg ${item.val}`} />
                          <span className="text-[11px] font-bold text-stone-500">{item.day}</span>
                        </div>
                      ))}

                    </div>
                  </div>

                </div>

                <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-between items-center text-xs shrink-0 rounded-b-[2rem]">
                  <span className="text-stone-500 font-semibold">¿Necesitas comparar costes financieros directos?</span>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="p-2 px-4 bg-pink-500 text-white text-xs font-bold rounded-xl hover:bg-pink-600 cursor-pointer"
                  >
                    Ver Comparativa Costes
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'pricing' && (
              <motion.div
                key="pricing-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-[2rem] border border-stone-200 shadow-xl p-8 h-full min-h-[640px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-3 py-1 rounded-full border border-rose-100 uppercase tracking-widest">
                        Análisis Financiero María
                      </span>
                      <h3 className="font-serif text-3xl font-bold text-stone-900 mt-2">
                        Menú Propio vs Plataforma Fresha
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Ayuda a María a tomar la mejor decisión para su peluquería en base al volumen del negocio.
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-[#da4d73] border border-pink-100">
                      <Coins className="w-6 h-6 text-pink-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    
                    {/* Comparative Table left */}
                    <div className="bg-stone-50 border border-stone-150 rounded-2.5xl p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-lg font-bold text-stone-900 mb-3 border-b pb-2 flex justify-between items-center">
                          <span>Menú Propio María</span>
                          <span className="text-emerald-600 text-xs">€0 Comisiones</span>
                        </h4>
                        
                        <p className="text-xs text-stone-500 leading-relaxed mb-4">
                          Desarrollado de forma local dentro de esta misma web. No tiene costes mensuales recurrentes y ningún porcentaje se deduce de tus ventas.
                        </p>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-stone-200/50">
                            <span className="text-stone-500">Mantenimiento mensual:</span>
                            <span className="font-bold text-emerald-600">€0 / mes</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-stone-200/50">
                            <span className="text-stone-500">Tasa por cita reservada:</span>
                            <span className="font-bold text-emerald-600">Sin coste (0%)</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-stone-200/50">
                            <span className="text-stone-500">Coste de recordatorios:</span>
                            <span className="font-bold text-emerald-600">Ilimitados gratis</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-stone-500">Comisión por pasarela:</span>
                            <span className="font-bold text-emerald-600">Cero</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-xl mt-6">
                        <p className="font-bold text-xs text-emerald-800 mb-1">Ideal para:</p>
                        <p className="text-[11px] text-emerald-700 leading-relaxed">
                          Peluquerías locales de confianza donde el contacto es de cercanía y se busca conservar el 100% de los márgenes netos.
                        </p>
                      </div>
                    </div>

                    {/* Comparative Table right */}
                    <div className="bg-stone-50 border border-stone-150 rounded-2.5xl p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-lg font-bold text-stone-900 mb-3 border-b pb-2 flex justify-between items-center">
                          <span>Software Fresha Pro</span>
                          <span className="text-purple-650 text-xs font-bold">Plataforma Premium</span>
                        </h4>
                        
                        <p className="text-xs text-stone-500 leading-relaxed mb-4">
                          Sistema en la nube líder que reduce cancelaciones con fianza obligatoria, pero cobra suscripciones por columna y tasas por transacción.
                        </p>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-stone-200/50">
                            <span className="text-stone-500">Mantenimiento mensual:</span>
                            <span className="font-bold text-stone-750">14,95 € (Indep.) o 9,95 € / miembro / mes</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-stone-200/50">
                            <span className="text-stone-500">Pagos Online:</span>
                            <span className="font-bold text-stone-750">1.29% + 0 € por transacción</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-stone-200/50">
                            <span className="text-stone-500">Pagos en Persona:</span>
                            <span className="font-bold text-stone-750">0.99% + 0 € (Tap to pay: +0.10 €)</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-stone-500">SMS / WhatsApp Auto:</span>
                            <span className="font-bold text-purple-700">50 gratis/mes (luego 0.05 € / SMS)</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 border border-purple-100 rounded-xl mt-6">
                        <p className="font-bold text-xs text-stone-900 mb-1">Ideal para:</p>
                        <p className="text-[11px] text-[#5b21b6] leading-relaxed">
                          Salones que sufren muchas citas falsas o cancelaciones de última hora y precisan de protección activa cobrando depósitos automáticos preventivos.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-between items-center text-xs shrink-0 rounded-b-[2rem]">
                  <span className="text-stone-500">¿Quieres entrar al Menú Propio para ver su funcionamiento sin costes?</span>
                  <button
                    onClick={onEnterCustomAdmin}
                    className="p-2 px-4 bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Entrar al Menú Propio
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </section>

      </div>

    </div>
  );
}
