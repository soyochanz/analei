/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scissors,
  Check,
  TrendingUp,
  CreditCard,
  UserPlus,
  Bell,
  Trash2,
  Calendar as CalendarIcon,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  CheckCircle2,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { Appointment } from '../types';
import { ADMIN_AVATAR } from '../data';
import LogoMaria from './LogoMaria';

interface DashboardViewProps {
  appointments: Appointment[];
  onToggleStatus: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  onChargeNoShow: (id: string) => Promise<void>;
  onOpenBooking: () => void;
}

export default function DashboardView({
  appointments,
  onToggleStatus,
  onDeleteAppointment,
  onChargeNoShow,
  onOpenBooking
}: DashboardViewProps) {
  // Calendar and list state filter
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2024-10-24'); // YYYY-MM-DD
  const [selectedNav, setSelectedNav] = useState<string>('dashboard');
  const [activeTableFilter, setActiveTableFilter] = useState<'all' | 'date-only' | 'pending-only'>('date-only');
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [processingNoShowId, setProcessingNoShowId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Month of October 2024 helper days (week starts on Monday 30th Sep)
  const calendarDays = [
    { day: 30, month: 9, fullDate: '2024-09-30', isCurrentMonth: false },
    { day: 1, month: 10, fullDate: '2024-10-01', isCurrentMonth: true },
    { day: 2, month: 10, fullDate: '2024-10-02', isCurrentMonth: true },
    { day: 3, month: 10, fullDate: '2024-10-03', isCurrentMonth: true },
    { day: 4, month: 10, fullDate: '2024-10-04', isCurrentMonth: true },
    { day: 5, month: 10, fullDate: '2024-10-05', isCurrentMonth: true },
    { day: 6, month: 10, fullDate: '2024-10-06', isCurrentMonth: true },
    { day: 7, month: 10, fullDate: '2024-10-07', isCurrentMonth: true },
    { day: 8, month: 10, fullDate: '2024-10-08', isCurrentMonth: true },
    { day: 9, month: 10, fullDate: '2024-10-09', isCurrentMonth: true },
    { day: 10, month: 10, fullDate: '2024-10-10', isCurrentMonth: true },
    { day: 11, month: 10, fullDate: '2024-10-11', isCurrentMonth: true },
    { day: 12, month: 10, fullDate: '2024-10-12', isCurrentMonth: true },
    { day: 13, month: 10, fullDate: '2024-10-13', isCurrentMonth: true },
    { day: 14, month: 10, fullDate: '2024-10-14', isCurrentMonth: true },
    { day: 15, month: 10, fullDate: '2024-10-15', isCurrentMonth: true },
    { day: 16, month: 10, fullDate: '2024-10-16', isCurrentMonth: true },
    { day: 17, month: 10, fullDate: '2024-10-17', isCurrentMonth: true },
    { day: 18, month: 10, fullDate: '2024-10-18', isCurrentMonth: true },
    { day: 19, month: 10, fullDate: '2024-10-19', isCurrentMonth: true },
    { day: 20, month: 10, fullDate: '2024-10-20', isCurrentMonth: true },
    { day: 21, month: 10, fullDate: '2024-10-21', isCurrentMonth: true },
    { day: 22, month: 10, fullDate: '2024-10-22', isCurrentMonth: true },
    { day: 23, month: 10, fullDate: '2024-10-23', isCurrentMonth: true },
    { day: 24, month: 10, fullDate: '2024-10-24', isCurrentMonth: true }, // Today Active
    { day: 25, month: 10, fullDate: '2024-10-25', isCurrentMonth: true },
    { day: 26, month: 10, fullDate: '2024-10-26', isCurrentMonth: true },
    { day: 27, month: 10, fullDate: '2024-10-27', isCurrentMonth: true },
    { day: 28, month: 10, fullDate: '2024-10-28', isCurrentMonth: true },
    { day: 29, month: 10, fullDate: '2024-10-29', isCurrentMonth: true },
    { day: 30, month: 10, fullDate: '2024-10-30', isCurrentMonth: true },
    { day: 31, month: 10, fullDate: '2024-10-31', isCurrentMonth: true }
  ];

  // Helper: check if a specific day has any appointments
  const hasAppointmentsOnDate = (fullDate: string) => {
    return appointments.some(a => a.date === fullDate);
  };

  // Get appointments for display based on active filter
  const getFilteredAppointments = () => {
    if (activeTableFilter === 'pending-only') {
      return appointments.filter(a => a.status === 'Pending');
    }
    if (activeTableFilter === 'date-only') {
      return appointments.filter(a => a.date === selectedCalendarDate);
    }
    return appointments; // 'all'
  };

  const displayedAppointments = getFilteredAppointments();
  const pendingRequestsCount = appointments.filter(a => a.status === 'Pending').length;

  const handleNoShowCharge = async (ap: Appointment) => {
    const amount = ap.noShowFeeAmount || 40;
    const canCharge = Boolean(ap.stripeCustomerId && ap.stripePaymentMethodId);

    if (!canCharge) {
      alert('Esta cita no tiene tarjeta de garantia. Solo se pueden cobrar no-shows de reservas creadas con Stripe.');
      return;
    }

    if (ap.paymentGuaranteeStatus === 'charged') {
      alert('Esta cita ya tiene un cargo no-show registrado.');
      return;
    }

    const confirmed = window.confirm(`Marcar a ${ap.clientName} como no-show y cobrar EUR ${amount}?`);
    if (!confirmed) return;

    setProcessingNoShowId(ap.id);
    try {
      await onChargeNoShow(ap.id);
    } finally {
      setProcessingNoShowId(null);
      setActiveActionMenuId(null);
    }
  };
  
  // Format selected date string for table readable header
  const getReadableTableHeader = () => {
    if (activeTableFilter === 'pending-only') {
      return 'Solicitudes Pendientes de Confirmación';
    }
    if (activeTableFilter === 'all') {
      return 'Todas las Citas Programadas';
    }
    // Date only
    const parts = selectedCalendarDate.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1] === '10' ? 'Octubre' : 'Noviembre';
      const day = parseInt(parts[2], 10);
      return `Citas del ${day} de ${month} [${year}]`;
    }
    return 'Citas';
  };

  return (
    <div className="flex bg-[#fffbfb] text-[#201315] antialiased overflow-x-hidden min-h-screen relative font-sans">
      
      {/* Background neon glows */}
      <div className="absolute top-[5%] left-[20%] w-[350px] h-[350px] bg-rose-100 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-amber-100/50 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Mobile Header Top Bar (Visible only on mobile/tablet) */}
      <div className="fixed top-0 inset-x-0 h-16 bg-white/90 backdrop-blur-md border-b border-rose-100 px-5 flex items-center justify-between md:hidden z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <LogoMaria className="flex flex-col items-start scale-90 origin-left" textClass="text-lg pt-1" showSubtext={false} />
          <div className="border-l border-rose-100 pl-2 ml-1">
            <span className="text-[9px] uppercase tracking-wider text-rose-450 font-bold block">Admin Portal</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl bg-rose-50 text-[#da4d73] border border-rose-100/60 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          title="Abrir Menú"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Slide-over Side Menu (Active via state on touch screens) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs"
            />
            
            {/* Content panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 180 }}
              className="relative flex flex-col w-72 max-w-[85vw] h-full bg-white p-5 gap-4 shadow-2xl border-r border-rose-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <LogoMaria className="flex flex-col items-start scale-90 origin-left" textClass="text-lg pt-1" showSubtext={false} />
                  <div className="border-l border-rose-100 pl-2 ml-1">
                    <span className="text-[9px] uppercase tracking-wider text-rose-450 font-bold block">Admin Portal</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl bg-rose-50 text-[#da4d73] border border-rose-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Admin Links */}
              <div className="flex flex-col gap-2 flex-grow mt-4 font-semibold text-xs tracking-wide">
                <button
                  onClick={() => { 
                    setSelectedNav('dashboard'); 
                    setActiveTableFilter('date-only'); 
                    setIsMobileMenuOpen(false); 
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    selectedNav === 'dashboard' && activeTableFilter === 'date-only'
                      ? 'bg-rose-50 text-[#da4d73] font-bold border border-rose-100 shadow-sm'
                      : 'text-stone-500 hover:bg-rose-50/50 hover:text-stone-850'
                  }`}
                >
                  <span className="material-symbols-outlined shrink-0 text-[#da4d73]" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                  Panel Principal
                </button>

                <button
                  onClick={() => { 
                    setSelectedNav('dashboard'); 
                    setActiveTableFilter('all'); 
                    setIsMobileMenuOpen(false); 
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    selectedNav === 'dashboard' && activeTableFilter === 'all'
                      ? 'bg-rose-50 text-[#da4d73] font-bold border border-rose-100 shadow-sm'
                      : 'text-stone-500 hover:bg-rose-50/50 hover:text-stone-850'
                  }`}
                >
                  <span className="material-symbols-outlined shrink-0 text-[#da4d73]">event_available</span>
                  Gestión Citas
                  <span className="ml-auto bg-[#da4d73] text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    {appointments.length}
                  </span>
                </button>

                <button
                  onClick={() => { 
                    setSelectedNav('dashboard'); 
                    setActiveTableFilter('pending-only'); 
                    setIsMobileMenuOpen(false); 
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    activeTableFilter === 'pending-only'
                      ? 'bg-rose-50 text-[#da4d73] font-bold border border-rose-100 shadow-sm'
                      : 'text-stone-500 hover:bg-rose-50/50 hover:text-stone-850'
                  }`}
                >
                  <span className="material-symbols-outlined shrink-0 text-amber-500">notifications_active</span>
                  Solicitudes
                  {pendingRequestsCount > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { 
                    setSelectedNav('clients'); 
                    setIsMobileMenuOpen(false); 
                    alert('Total de clientes registrados: 28 (+4 esta semana).'); 
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    selectedNav === 'clients' ? 'bg-rose-50 text-[#da4d73] border border-rose-100 font-bold' : 'text-stone-500 hover:bg-rose-50/50 hover:text-stone-850'
                  }`}
                >
                  <span className="material-symbols-outlined shrink-0 text-[#da4d73]">group</span>
                  Fichas Clientes
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    alert('Parámetros de configuración general del local cargados correctamente.');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 hover:bg-rose-50/50 hover:text-stone-850 rounded-xl transition-all font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined shrink-0 text-[#da4d73]">settings</span>
                  Ajustes de Salón
                </button>
              </div>

              {/* Action Button inside mobile drawer */}
              <div className="py-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenBooking();
                  }}
                  className="w-full bg-[#da4d73] text-white py-3 rounded-full text-xs font-bold hover:bg-rose-600 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Reserva
                </button>
              </div>

              {/* Drawer User profile */}
              <div className="mt-auto border-t border-rose-100 pt-4 flex flex-col gap-2 text-xs">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    alert('Servicio Técnico María y Estética: soporte@peluqueriamaria.com');
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-stone-500 hover:bg-rose-50/50 hover:text-stone-800 rounded-xl transition-all text-left font-semibold cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[#da4d73]" />
                  Ayuda & Soporte
                </button>
                
                <div className="flex items-center gap-3 px-3 py-2 bg-rose-50/50 rounded-xl border border-rose-100/60">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-rose-200 shrink-0">
                    <img src={ADMIN_AVATAR} alt="Admin Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-[11px] text-stone-850">María Admin</p>
                    <p className="text-[9px] text-stone-500">Director Técnico</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SideNavBar Component (Light Frosted Column - Visible only on Desktop screens) */}
      <nav className="fixed left-0 top-0 hidden md:flex flex-col h-screen w-64 bg-white border-r border-rose-100 p-5 gap-2.5 z-30 shadow-sm">
        
        {/* Brand Area */}
        <div className="px-3 py-6 mb-2">
          <LogoMaria className="flex flex-col items-start" textClass="text-3xl pt-2" showSubtext={true} />
          <span className="text-[10px] uppercase tracking-widest text-[#453335]/70 font-bold block mt-2.5 font-sans">Admin Portal</span>
        </div>

        {/* Navigation Admin Links */}
        <div className="flex flex-col gap-2 flex-grow font-semibold text-xs tracking-wide">
          <button
            onClick={() => { setSelectedNav('dashboard'); setActiveTableFilter('date-only'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              selectedNav === 'dashboard' && activeTableFilter === 'date-only'
                ? 'bg-rose-55 text-[#da4d73] font-bold border border-rose-100 shadow-sm'
                : 'text-stone-500 hover:bg-rose-55/50 hover:text-stone-850'
            }`}
          >
            <span className="material-symbols-outlined shrink-0 text-[#da4d73]" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            Panel Principal
          </button>

          <button
            onClick={() => { setSelectedNav('dashboard'); setActiveTableFilter('all'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              selectedNav === 'dashboard' && activeTableFilter === 'all'
                ? 'bg-rose-55 text-[#da4d73] font-bold border border-rose-100 shadow-sm'
                : 'text-stone-500 hover:bg-rose-55/50 hover:text-stone-850'
            }`}
          >
            <span className="material-symbols-outlined shrink-0 text-[#da4d73]">event_available</span>
            Gestión Citas
            <span className="ml-auto bg-[#da4d73] text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
              {appointments.length}
            </span>
          </button>

          <button
            onClick={() => { setSelectedNav('dashboard'); setActiveTableFilter('pending-only'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              activeTableFilter === 'pending-only'
                ? 'bg-rose-55 text-[#da4d73] font-bold border border-rose-100 shadow-sm'
                : 'text-stone-500 hover:bg-rose-55/50 hover:text-stone-850'
            }`}
          >
            <span className="material-symbols-outlined shrink-0 text-amber-500 animate-pulse">notifications_active</span>
            Solicitudes
            {pendingRequestsCount > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setSelectedNav('clients'); alert('Total de clientes registrados: 28 (+4 esta semana).'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              selectedNav === 'clients' ? 'bg-rose-55 text-[#da4d73] border border-rose-100 font-bold' : 'text-stone-500 hover:bg-rose-55/50 hover:text-stone-850'
            }`}
          >
            <span className="material-symbols-outlined shrink-0 text-[#da4d73]">group</span>
            Fichas Clientes
          </button>

          <button
            onClick={() => alert('Parámetros de configuración general del local cargados correctamente.')}
            className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 hover:bg-rose-55/50 hover:text-stone-850 rounded-xl transition-all font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined shrink-0 text-[#da4d73]">settings</span>
            Ajustes de Salón
          </button>
        </div>

        {/* New Appointment Primary CTA inside Sidebar */}
        <div className="px-1 py-4">
          <button
            onClick={onOpenBooking}
            className="w-full bg-[#da4d73] text-white py-3 rounded-full text-xs font-bold hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/10 transition-all flex items-center justify-center gap-2 group uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Nueva Reserva
          </button>
        </div>

        {/* Footer info area with user profile */}
        <div className="mt-auto border-t border-rose-100 pt-4 flex flex-col gap-1.5 text-xs">
          <button
            onClick={() => alert('Servicio Técnico María y Estética: soporte@peluqueriamaria.com')}
            className="flex items-center gap-3 px-4 py-2 text-stone-500 hover:bg-rose-55/50 hover:text-stone-800 rounded-xl transition-all text-left font-semibold cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#da4d73]" />
            Ayuda & Soporte
          </button>
          
          <div className="flex items-center gap-3 px-4 py-3 mt-2 bg-rose-55/50 rounded-xl border border-rose-100/60">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-rose-200 shrink-0">
              <img src={ADMIN_AVATAR} alt="Admin Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="truncate">
              <p className="font-bold text-xs text-stone-850">María Admin</p>
              <p className="text-[10px] text-stone-500">Director Técnico</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Panel Area - Balanced top padding for mobile layout standard fit */}
      <main className="flex-1 md:ml-64 p-6 md:p-12 pt-24 md:pt-12 w-full min-h-screen bg-transparent relative z-10">
        
        {/* Top Header Panel controls */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-rose-150 col-span-12">
          <div>
            <h2 className="font-serif text-stone-900 text-3xl md:text-3.5xl font-bold mb-1">Panel de Control</h2>
            <p className="text-xs text-stone-500 font-sans">Bienvenida de nuevo, María. Revisa el estado de la peluquería en tiempo real.</p>
          </div>

          {/* Quick Date alerts & pending requests notifications */}
          <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between">
            <div className="text-right">
              <p className="text-xs font-bold text-stone-900 uppercase tracking-wider">Jueves, Octubre 24</p>
              <button
                onClick={() => setActiveTableFilter('pending-only')}
                className="text-xs font-bold text-[#da4d73] hover:text-rose-600 hover:underline flex items-center gap-1 mt-0.5"
              >
                {pendingRequestsCount} Reservas Pendientes
              </button>
            </div>
            
            <div className="relative">
              <button
                onClick={() => {
                  setActiveTableFilter('pending-only');
                  alert(`Filtrando por las ${pendingRequestsCount} solicitudes pendientes que requieren tu aprobación.`);
                }}
                className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-stone-700 border border-rose-100 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Bandeja de decisiones"
              >
                <Bell className={`w-5 h-5 text-amber-500 ${pendingRequestsCount > 0 ? 'animate-bounce' : ''}`} />
                {pendingRequestsCount > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-full border-2 border-white"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Bento Stats Grid Cards (Classic Frosted Glass metrics) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 col-span-12">
          
          {/* Metrics card 1: Appointments Count */}
          <div
            onClick={() => setActiveTableFilter('all')}
            className="bg-white rounded-[24px] p-6 border border-rose-100 shadow-sm relative overflow-hidden group hover:bg-[#fffdfd] hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer"
            title="Hacer clic para ver todas las citas"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#da4d73]">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="bg-rose-50 border border-rose-100 text-[#da4d73] font-bold text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">Hoy</span>
            </div>
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Citas Agendadas</h3>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-stone-900 font-serif">{appointments.length}</p>
              <p className="text-[10px] font-bold text-emerald-600 mb-1.5 flex items-center gap-0.5 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                <TrendingUp className="w-3 h-3" /> +2 hoy
              </p>
            </div>
          </div>

          {/* Metrics card 2: Estimated Weekly Revenue */}
          <div
            onClick={() => alert(`Caja estimada semanal basada en el precio de los servicios: €2,450 EUR.`)}
            className="bg-white rounded-[24px] p-6 border border-rose-100 shadow-sm relative overflow-hidden group hover:bg-[#fffdfd] hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer"
            title="Hacer clic para ver desglose de caja"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="bg-purple-50 border border-purple-100 text-purple-700 font-bold text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">Semana</span>
            </div>
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Caja Estimada</h3>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-stone-900 font-serif">€2,450</p>
              <p className="text-[10px] font-bold text-purple-600 mb-1.5 flex items-center gap-0.5 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">
                <TrendingUp className="w-3 h-3" /> +12%
              </p>
            </div>
          </div>

          {/* Metrics card 3: New Customer growth list */}
          <div
            onClick={() => { setSelectedNav('clients'); alert('Suscripciones a boletín semanales: 28 nuevos perfiles.'); }}
            className="bg-white rounded-[24px] p-6 border border-rose-100 shadow-sm relative overflow-hidden group hover:bg-[#fffdfd] hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer"
            title="Hacer clic para ver archivo de clientes"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#fff5f6] border border-rose-100 flex items-center justify-center text-[#da4d73]">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="bg-rose-50 border border-rose-100 text-[#da4d73] font-bold text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">Mes</span>
            </div>
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Nuevos Clientes</h3>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-stone-900 font-serif">28</p>
              <p className="text-[10px] font-bold text-stone-500 mb-1.5 flex items-center bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full font-sans">
                Sostenido
              </p>
            </div>
          </div>

        </section>

        {/* Scheduling Core Columns (Interactive calendar and booking tables) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 col-span-12">
          
          {/* Column A (Upcoming Appointments list table) */}
          <div className="lg:col-span-8 bg-white border border-rose-100 rounded-[28px] p-6 md:p-8 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header block with controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="font-serif text-stone-900 text-xl font-bold">
                    {getReadableTableHeader()}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    {activeTableFilter === 'pending-only' 
                      ? 'Decide si confirmar o rechazar las solicitudes entrantes.'
                      : 'Citas programadas para atención física.'}
                  </p>
                </div>
                
                {/* Reset or display controls */}
                {activeTableFilter !== 'date-only' && (
                  <button
                    onClick={() => setActiveTableFilter('date-only')}
                    className="text-xs bg-[#da4d73] text-white font-bold px-4 py-2 rounded-full hover:bg-rose-600 transition-all cursor-pointer"
                  >
                    Ver fecha seleccionada
                  </button>
                )}
              </div>

              {/* Grid or Table listing appointments */}
              {displayedAppointments.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-rose-200 rounded-2xl bg-rose-50/20 flex flex-col items-center justify-center p-6">
                  <AlertCircle className="w-8 h-8 text-amber-500 mb-3" />
                  <p className="text-xs font-bold text-stone-800">No hay citas registradas</p>
                  <p className="text-[11px] text-stone-500 mt-1.5 max-w-sm">
                    {activeTableFilter === 'date-only' 
                      ? 'No hay reservas para esta fecha en el calendario. ¡Intenta hacer clic en otra fecha con indicador!'
                      : 'No hay citas registradas en esta categoría actualmente.'}
                  </p>
                  <button
                    onClick={onOpenBooking}
                    className="mt-5 px-5 py-2 bg-[#da4d73] text-white text-xs font-bold rounded-full uppercase hover:bg-rose-600 transition-all cursor-pointer"
                  >
                    + Agendar Cita
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-rose-50 text-stone-400 font-sans">
                        <th className="py-3 px-2 font-bold text-[10px] tracking-wider uppercase">Cliente</th>
                        <th className="py-3 px-2 font-bold text-[10px] tracking-wider uppercase">Servicio</th>
                        <th className="py-3 px-2 font-bold text-[10px] tracking-wider uppercase">Hora / Fecha</th>
                        <th className="py-3 px-2 font-bold text-[10px] tracking-wider uppercase">Estado</th>
                        <th className="py-3 px-2 text-right text-[10px] tracking-wider uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {displayedAppointments.map((ap) => (
                        <tr key={ap.id} className="border-b border-rose-50 hover:bg-rose-50/10 transition-colors group">
                          
                          {/* Client details initials badge */}
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center uppercase font-bold text-xs shrink-0 select-none ${ap.avatarColor}`}>
                                {ap.clientInitials}
                              </div>
                              <span className="font-bold text-stone-900 text-xs block">{ap.clientName}</span>
                            </div>
                          </td>

                          {/* Treatment choice */}
                          <td className="py-4 px-2 text-stone-600 text-xs font-sans">
                            {ap.service}
                          </td>

                          {/* Schedule times/Dates split */}
                          <td className="py-4 px-2">
                            <span className="font-bold block text-stone-850 font-sans">{ap.time}</span>
                            <span className="text-[10px] text-stone-400 block mt-0.5 font-mono select-none">
                              {ap.date}
                            </span>
                          </td>

                          {/* Status and confirming actions */}
                          <td className="py-4 px-2">
                            <div className="flex flex-col gap-1.5 items-start">
                              {ap.status === 'NoShow' ? (
                                <span className="bg-stone-900 text-white font-bold text-[10px] px-2.5 py-1 rounded-full border border-stone-900 flex items-center gap-1 w-fit select-none">
                                  No-show
                                </span>
                              ) : ap.status === 'Cancelled' ? (
                                <span className="bg-stone-100 text-stone-600 font-bold text-[10px] px-2.5 py-1 rounded-full border border-stone-200 flex items-center gap-1 w-fit select-none">
                                  Cancelada
                                </span>
                              ) : ap.status === 'Confirmed' ? (
                                <span className="bg-rose-50 text-[#da4d73] font-bold text-[10px] px-2.5 py-1 rounded-full border border-rose-100 flex items-center gap-1 w-fit select-none">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#da4d73] inline-block animate-ping"></span>
                                  Confirmado
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-750 font-bold text-[10px] px-2.5 py-1 rounded-full border border-amber-150 flex items-center gap-1.5 w-fit select-none">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                                  Pendiente
                                </span>
                              )}
                              {ap.paymentGuaranteeStatus === 'secured' && (
                                <span className="bg-emerald-50 text-emerald-700 font-bold text-[9px] px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 w-fit select-none">
                                  <CreditCard className="w-3 h-3" />
                                  Tarjeta guardada
                                </span>
                              )}
                              {ap.paymentGuaranteeStatus === 'charged' && (
                                <span className="bg-stone-100 text-stone-700 font-bold text-[9px] px-2 py-0.5 rounded-full border border-stone-200 w-fit select-none">
                                  No-show cobrado
                                </span>
                              )}
                              {ap.paymentGuaranteeStatus === 'charge_failed' && (
                                <span className="bg-rose-50 text-rose-700 font-bold text-[9px] px-2 py-0.5 rounded-full border border-rose-200 w-fit select-none">
                                  Cobro fallido
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Menu Actions options */}
                          <td className="py-4 px-2 text-right relative">
                            <div className="flex justify-end gap-1.5">
                              {/* Quick click confirm for pending items */}
                              {ap.status === 'Pending' && (
                                <button
                                  onClick={() => {
                                    onToggleStatus(ap.id);
                                    alert(`Cita de ${ap.clientName} confirmada con éxito.`);
                                  }}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-rose-150"
                                  title="Confirmar Cita Automática"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {ap.stripeCustomerId && ap.stripePaymentMethodId && ap.paymentGuaranteeStatus !== 'charged' && (
                                <button
                                  onClick={() => handleNoShowCharge(ap)}
                                  disabled={processingNoShowId === ap.id}
                                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer border border-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={`Marcar no-show y cobrar EUR ${ap.noShowFeeAmount || 40}`}
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  {processingNoShowId === ap.id ? 'Cobrando' : 'No-show'}
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  setActiveActionMenuId(activeActionMenuId === ap.id ? null : ap.id);
                                }}
                                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-rose-50 border border-rose-100 transition-all cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Small context menu popover (Frosted mini popover) */}
                              {activeActionMenuId === ap.id && (
                                <div className="absolute right-2 top-11 bg-white border border-rose-150 rounded-xl shadow-xl p-1.5 z-25 text-left w-40">
                                  <button
                                    onClick={() => {
                                      onToggleStatus(ap.id);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2 py-1.5 hover:bg-rose-50 rounded-lg transition-colors text-[11px] font-bold text-stone-800 cursor-pointer"
                                  >
                                    Revertir Estado
                                  </button>
                                  <button
                                    onClick={() => handleNoShowCharge(ap)}
                                    disabled={!ap.stripeCustomerId || !ap.stripePaymentMethodId || ap.paymentGuaranteeStatus === 'charged' || processingNoShowId === ap.id}
                                    className="w-full text-left px-2 py-1.5 hover:bg-purple-50 text-purple-700 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    {processingNoShowId === ap.id ? 'Cobrando...' : `No-show + EUR ${ap.noShowFeeAmount || 40}`}
                                  </button>
                                  <button
                                    onClick={() => {
                                      onDeleteAppointment(ap.id);
                                      setActiveActionMenuId(null);
                                      alert('Reserva eliminada de la agenda.');
                                    }}
                                    className="w-full text-left px-2 py-1.5 hover:bg-rose-500/10 text-rose-600 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Eliminar Cita
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* List status filters summary bar */}
            <div className="mt-8 pt-4 border-t border-rose-100 flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold">Mostrando {displayedAppointments.length} resultados</span>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setActiveTableFilter('date-only')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeTableFilter === 'date-only' ? 'bg-rose-50 text-[#da4d73] border border-rose-150 font-bold' : 'hover:bg-rose-50/50'}`}
                >
                  Fecha actual
                </button>
                <button 
                  onClick={() => setActiveTableFilter('all')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeTableFilter === 'all' ? 'bg-rose-50 text-[#da4d73] border border-rose-150 font-bold' : 'hover:bg-rose-50/50'}`}
                >
                  Ver todas
                </button>
              </div>
            </div>

          </div>

          {/* Column B (Beautiful Calendar Widget - Frosted Glass Version) */}
          <div className="lg:col-span-4 bg-white border border-rose-100 rounded-[28px] p-6 shadow-sm h-fit">
            
            {/* Header control */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-stone-900 text-base font-bold">Octubre 2024</h3>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => alert('Solo se muestra Octubre de 2024 (Fecha fijada por demostración del diseño).')}
                  className="p-1 px-1.5 text-stone-400 hover:text-stone-800 transition-colors hover:bg-rose-50 rounded-lg cursor-pointer"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => alert('Solo se muestra Octubre de 2024 (Fecha fijada por demostración).')}
                  className="p-1 px-1.5 text-stone-400 hover:text-stone-800 transition-colors hover:bg-rose-50 rounded-lg cursor-pointer"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar grid layout */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs mb-4">
              
              {/* Day Titles */}
              {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
                <div key={d} className="text-stone-400 py-1.5 select-none font-bold">
                  {d}
                </div>
              ))}

              {/* Days matching calendar layout */}
              {calendarDays.map((c, i) => {
                const isActive = selectedCalendarDate === c.fullDate;
                const matchesTodayRef = c.day === 24 && c.month === 10; // Oct 24th standard "Today" ref
                const hasAppointments = hasAppointmentsOnDate(c.fullDate);

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (c.isCurrentMonth) {
                        setSelectedCalendarDate(c.fullDate);
                        setActiveTableFilter('date-only');
                      } else {
                        alert('Selecciona un día del mes de Octubre.');
                      }
                    }}
                    className={`relative py-3 rounded-xl text-xs font-bold select-none flex flex-col items-center justify-center transition-all cursor-pointer ${
                      !c.isCurrentMonth
                        ? 'text-stone-350 opacity-30 cursor-default'
                        : isActive
                          ? 'bg-[#da4d73] text-white font-bold shadow-md shadow-rose-500/20'
                          : matchesTodayRef
                            ? 'bg-rose-50 text-[#da4d73] font-bold border border-rose-100'
                            : 'text-stone-700 hover:bg-rose-50 hover:scale-105'
                    }`}
                  >
                    <span>{c.day}</span>
                    
                    {/* Indicators dots for days with scheduled events */}
                    {c.isCurrentMonth && hasAppointments && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                        isActive ? 'bg-white' : 'bg-[#da4d73]'
                      }`}></span>
                    )}
                  </button>
                );
              })}

            </div>

            {/* Bottom highlights metadata */}
            <div className="pt-4 border-t border-rose-100 mt-5 font-sans">
              <p className="text-[10px] font-bold text-stone-405 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#da4d73] inline-block shrink-0"></span>
                Días con Citas Agendadas
              </p>
              
              <button
                onClick={() => {
                  setSelectedCalendarDate('2024-10-24');
                  setActiveTableFilter('date-only');
                  alert('Fijado de regreso al día "Hoy" (24 de Octubre).');
                }}
                className="w-full bg-[#fff5f6] border border-rose-200 hover:border-rose-350 text-[#da4d73] py-2.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider block text-center cursor-pointer"
              >
                Volver al Día Principal (Oct 24)
              </button>
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}
