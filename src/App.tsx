/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, Heart, ShieldCheck, ChevronRight, User, Scissors } from 'lucide-react';
import { INITIAL_APPOINTMENTS } from './data';
import { Appointment, Article } from './types';
import ClientPortalView from './components/ClientPortalView';
import DashboardView from './components/DashboardView';
import BookingModal from './components/BookingModal';
import BlogReaderModal from './components/BlogReaderModal';
import AdminGateSelector from './components/AdminGateSelector';
import FreshaSimulationView from './components/FreshaSimulationView';
import AgencyInfoModal from './components/AgencyInfoModal';

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [activeView, setActiveView] = useState<'client' | 'admin' | 'fresha'>('client');
  const [visualTheme, setVisualTheme] = useState<'color' | 'mono'>(() => {
    try {
      return window.localStorage.getItem('maria-visual-theme') === 'mono' ? 'mono' : 'color';
    } catch {
      return 'color';
    }
  });
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isAdminGateOpen, setIsAdminGateOpen] = useState(false);
  const [isAgencyInfoOpen, setIsAgencyInfoOpen] = useState(false);

  // Sync state or log newly updated appointments
  useEffect(() => {
    console.log("State synchronized: ", appointments.length, "appointments loaded.");
  }, [appointments]);

  useEffect(() => {
    document.documentElement.dataset.theme = visualTheme;
    try {
      window.localStorage.setItem('maria-visual-theme', visualTheme);
    } catch {
      // Ignore private browsing/storage restrictions; the switch still works in-session.
    }
  }, [visualTheme]);

  // Handler to register a new appointment requested by client or manager
  const handleAddNewAppointment = (
    newAp: Omit<Appointment, 'id' | 'clientInitials' | 'avatarColor'>
  ) => {
    // Generate simple initials
    const initials = newAp.clientName
      .split(' ')
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase() || 'CX';

    // Cycle gorgeous glowing bright pink/rose/lavender combinations for light glassmorphism avatars
    const colorCombos = [
      'bg-rose-50 text-[#da4d73] border border-rose-100',
      'bg-purple-50 text-[#a855f7] border border-purple-150',
      'bg-pink-50 text-pink-600 border border-pink-100',
      'bg-teal-50 text-teal-700 border border-teal-100',
      'bg-amber-50 text-amber-700 border border-amber-100'
    ];
    const randomIndex = Math.floor(Math.random() * colorCombos.length);

    const fullAppointment: Appointment = {
      ...newAp,
      id: `new-${Date.now()}`,
      clientInitials: initials,
      avatarColor: colorCombos[randomIndex]
    };

    setAppointments(prev => [fullAppointment, ...prev]);
  };

  // Handler to confirm pending status
  const handleToggleStatus = (id: string) => {
    setAppointments(prev =>
      prev.map(ap => {
        if (ap.id === id) {
          return {
            ...ap,
            status: ap.status === 'Confirmed' ? 'Pending' : 'Confirmed'
          };
        }
        return ap;
      })
    );
  };

  // Handler to delete appointments from schedule index
  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(ap => ap.id !== id));
  };

  const handleChargeNoShow = async (id: string) => {
    const appointment = appointments.find(ap => ap.id === id);
    if (!appointment) return;

    if (!appointment.stripeCustomerId || !appointment.stripePaymentMethodId) {
      alert('Esta cita no tiene una tarjeta de garantia guardada en Stripe.');
      return;
    }

    try {
      const response = await fetch('/api/charge-no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          clientName: appointment.clientName,
          customerId: appointment.stripeCustomerId,
          paymentMethodId: appointment.stripePaymentMethodId,
          amount: (appointment.noShowFeeAmount || 40) * 100
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo cobrar el no-show.');
      }

      setAppointments(prev =>
        prev.map(ap =>
          ap.id === id
            ? {
                ...ap,
                paymentGuaranteeStatus: 'charged',
                noShowChargeId: payload.paymentIntentId
              }
            : ap
        )
      );
      alert(`Cargo no-show realizado correctamente: ${payload.paymentIntentId}`);
    } catch (error) {
      setAppointments(prev =>
        prev.map(ap =>
          ap.id === id ? { ...ap, paymentGuaranteeStatus: 'charge_failed' } : ap
        )
      );
      alert(error instanceof Error ? error.message : 'No se pudo cobrar el no-show.');
    }
  };

  // Helper function to handle reading tip articles
  const handleReadArticle = (article: Article) => {
    setSelectedArticle(article);
  };

  return (
    <div className="theme-shell relative font-sans bg-[#fff8f8] text-stone-800 antialiased min-h-screen">
      
      {/* Dynamic View Panel Router with fade-in animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="w-full h-full"
        >
          {activeView === 'client' ? (
            <ClientPortalView 
              onOpenBooking={() => setIsBookingOpen(true)}
              onReadArticle={handleReadArticle}
              visualTheme={visualTheme}
              onToggleVisualTheme={() => setVisualTheme(prev => prev === 'color' ? 'mono' : 'color')}
            />
          ) : activeView === 'admin' ? (
            <DashboardView
              appointments={appointments}
              onToggleStatus={handleToggleStatus}
              onDeleteAppointment={handleDeleteAppointment}
              onChargeNoShow={handleChargeNoShow}
              onOpenBooking={() => setIsBookingOpen(true)}
            />
          ) : (
            <FreshaSimulationView
              onBackToClient={() => setActiveView('client')}
              onEnterCustomAdmin={() => setActiveView('admin')}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating Global Role/View Selector Trigger HUD (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5 pointer-events-none">
        {/* Helper guide alert bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="bg-white/95 text-stone-800 text-[10px] font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-rose-100/80 backdrop-blur-xl pointer-events-auto flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#da4d73] animate-pulse" />
          <span>Vista actual: <b className="text-[#da4d73] uppercase font-sans tracking-wider">
            {activeView === 'client' ? 'Público (Clientes)' : activeView === 'admin' ? 'Administración' : 'Demostración Fresha'}
          </b></span>
        </motion.div>

        {/* Action swap button */}
        <button
          onClick={() => {
            if (activeView === 'client') {
              setIsAdminGateOpen(true);
            } else {
              setActiveView('client');
            }
          }}
          className="bg-stone-900 text-white font-bold text-xs tracking-wider px-5 py-3.5 rounded-full shadow-2xl hover:bg-stone-950 border border-stone-800 hover:border-[#da4d73]/50 backdrop-blur-2xl hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center gap-2 cursor-pointer"
          id="role-switch-floating-btn"
          title="Alternar entre la web de clientes y el panel de administración"
        >
          {activeView === 'client' ? (
            <>
              <ShieldCheck className="w-4 h-4 text-[#da4d73]" />
              <span className="uppercase font-sans font-extrabold text-[10px]">Entrar al Panel Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#da4d73]" />
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#da4d73]" />
              <span className="uppercase font-sans font-extrabold text-[10px]">Ver Web de Clientes</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#da4d73]" />
            </>
          )}
        </button>
      </div>

      {/* Admin Gate choice modal overlay */}
      <AnimatePresence>
        {isAdminGateOpen && (
          <AdminGateSelector
            isOpen={isAdminGateOpen}
            onClose={() => setIsAdminGateOpen(false)}
            onSelectInternal={() => setActiveView('admin')}
            onSelectFresha={() => setActiveView('fresha')}
          />
        )}
      </AnimatePresence>

      {/* Booking Form Dialog Modal Portal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBook={handleAddNewAppointment}
      />

      {/* Blog Article Reader Modal Panel */}
      <BlogReaderModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      {/* Floating Agency/Website Info Trigger (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-40 pointer-events-none">
        {/* Action button featuring only the custom SVG logo */}
        <button
          onClick={() => setIsAgencyInfoOpen(true)}
          className="bg-white text-stone-800 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl hover:bg-rose-50/60 border border-rose-100 hover:border-[#da4d73]/60 backdrop-blur-2xl hover:scale-110 active:scale-95 transition-all pointer-events-auto flex items-center justify-center cursor-pointer p-3.5 shadow-rose-100/50"
          id="agency-info-floating-btn"
          title="Ver ventajas de tener una web propia para tu salón"
        >
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform -translate-y-0.5">
            <defs>
              <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3f4f6" />
                <stop offset="50%" stopColor="#d1d5db" />
                <stop offset="100%" stopColor="#9ca3af" />
              </linearGradient>
              <linearGradient id="gold-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="50%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#fef08a" />
              </linearGradient>
            </defs>
            <path d="M45 15 L20 85 L32 85 L50 35 L45 15 Z" fill="url(#silver-grad)" />
            <path d="M52 35 L70 85 L82 85 L57 15 L52 35 Z" fill="url(#silver-grad)" />
            <path d="M68 58 L85 85 L91 85 L74 58 Z" fill="url(#silver-grad)" opacity="0.8" />
            <path d="M15 80 L75 32 L78 36 L18 84 Z" fill="url(#gold-grad)" />
            <path d="M72 26 L91 35 L82 52 L75 44 L72 26 Z" fill="url(#gold-grad)" />
          </svg>
        </button>
      </div>

      {/* Agency Informative Modal */}
      <AgencyInfoModal
        isOpen={isAgencyInfoOpen}
        onClose={() => setIsAgencyInfoOpen(false)}
      />

    </div>
  );
}
