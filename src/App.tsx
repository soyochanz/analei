/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';
import { INITIAL_APPOINTMENTS } from './data';
import { Appointment, Article } from './types';
import ClientPortalView from './components/ClientPortalView';
import DashboardView from './components/DashboardView';
import BookingModal from './components/BookingModal';
import BlogReaderModal from './components/BlogReaderModal';
import AdminGateSelector from './components/AdminGateSelector';
import FreshaSimulationView from './components/FreshaSimulationView';
import AgencyInfoModal from './components/AgencyInfoModal';
import { invokeFunction, supabase } from './lib/supabase';

type DbAppointment = {
  id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  service_name: string;
  stylist_id?: string;
  stylists?: { name?: string };
  appointment_time: string;
  appointment_date: string;
  status: Appointment['status'];
  price_cents: number;
  stripe_customer_id?: string;
  stripe_payment_method_id?: string;
  payment_guarantee_status?: Appointment['paymentGuaranteeStatus'];
  no_show_fee_cents?: number;
  no_show_charge_id?: string;
};

const avatarColorCombos = [
  'bg-rose-50 text-[#da4d73] border border-rose-100',
  'bg-purple-50 text-[#a855f7] border border-purple-150',
  'bg-pink-50 text-pink-600 border border-pink-100',
  'bg-teal-50 text-teal-700 border border-teal-100',
  'bg-amber-50 text-amber-700 border border-amber-100'
];

const getInitials = (clientName: string) =>
  clientName
    .split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'CX';

const appointmentFromDb = (ap: DbAppointment, index: number): Appointment => ({
  id: ap.id,
  clientName: ap.client_name,
  clientEmail: ap.client_email,
  clientPhone: ap.client_phone,
  clientInitials: getInitials(ap.client_name),
  service: ap.service_name,
  stylistId: ap.stylist_id,
  stylistName: ap.stylists?.name,
  time: ap.appointment_time,
  date: ap.appointment_date,
  status: ap.status,
  price: Math.round(ap.price_cents / 100),
  stripeCustomerId: ap.stripe_customer_id,
  stripePaymentMethodId: ap.stripe_payment_method_id,
  paymentGuaranteeStatus: ap.payment_guarantee_status,
  noShowFeeAmount: Math.round((ap.no_show_fee_cents ?? 0) / 100),
  noShowChargeId: ap.no_show_charge_id,
  avatarColor: avatarColorCombos[index % avatarColorCombos.length]
});

const staffToStylists = (staff: any[] = []) =>
  staff
    .filter(s => s.is_active !== false && s.stylist_id)
    .map(s => ({ id: s.stylist_id, name: s.name, email: s.email }));

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
  const [adminSession, setAdminSession] = useState<any>(null);
  const [stylists, setStylists] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAdminSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setAdminSession(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      alert('Falta configurar Supabase.');
      return;
    }
    const result = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      : await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (result.error) {
      alert(result.error.message);
      return;
    }
    if (authMode === 'register') {
      await invokeFunction('admin-panel', {
        action: 'upsert_staff',
        staff: {
          auth_user_id: result.data.user?.id,
          email: authEmail,
          name: authEmail.split('@')[0],
          role: 'admin',
          is_admin: true
        }
      }).catch(() => undefined);
    }
    setAdminSession(result.data.session);
  };

  // Sync state or log newly updated appointments
  useEffect(() => {
    console.log("State synchronized: ", appointments.length, "appointments loaded.");
  }, [appointments]);

  useEffect(() => {
    invokeFunction<{ appointments: DbAppointment[] }>('list-appointments', {})
      .then(({ appointments: savedAppointments }) => {
        if (!savedAppointments.length) return;
        setAppointments(prev => {
          const demoAppointments = prev.filter(ap => !savedAppointments.some(saved => saved.id === ap.id));
          return [
            ...savedAppointments.map(appointmentFromDb),
            ...demoAppointments
          ];
        });
      })
      .catch(error => {
        console.warn('No se pudieron cargar las citas de Supabase:', error);
      });
  }, []);

  useEffect(() => {
    invokeFunction<{ staff: any[] }>('admin-panel', { action: 'load' })
      .then(data => setStylists(staffToStylists(data.staff || [])))
      .catch(() => undefined);
  }, []);

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
    newAp: Omit<Appointment, 'clientInitials' | 'avatarColor'>
  ) => {
    // Generate simple initials
    const randomIndex = Math.floor(Math.random() * avatarColorCombos.length);

    const fullAppointment: Appointment = {
      ...newAp,
      id: newAp.id || `new-${Date.now()}`,
      clientInitials: getInitials(newAp.clientName),
      avatarColor: avatarColorCombos[randomIndex]
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

  const handleUpdateAppointmentStatus = (id: string, status: Appointment['status'], updates?: Partial<Appointment>) => {
    setAppointments(prev =>
      prev.map(ap => ap.id === id ? { ...ap, ...updates, status } : ap)
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
      throw new Error('Esta cita no tiene una tarjeta de garantia guardada en Stripe.');
    }

    try {
      const payload = await invokeFunction<{
        appointment: {
          id: string;
          payment_guarantee_status: 'secured' | 'not_required' | 'charged' | 'charge_failed';
          no_show_charge_id?: string;
          no_show_fee_cents?: number;
          status: Appointment['status'];
        };
        paymentIntentId: string;
      }>('charge-no-show', {
        appointmentId: appointment.id
      });

      setAppointments(prev =>
        prev.map(ap =>
          ap.id === id
            ? {
                ...ap,
                status: payload.appointment.status,
                paymentGuaranteeStatus: payload.appointment.payment_guarantee_status,
                noShowFeeAmount: payload.appointment.no_show_fee_cents !== undefined
                  ? Math.round(payload.appointment.no_show_fee_cents / 100)
                  : ap.noShowFeeAmount,
                noShowChargeId: payload.appointment.no_show_charge_id || payload.paymentIntentId
              }
            : ap
        )
      );
    } catch (error) {
      setAppointments(prev =>
        prev.map(ap =>
          ap.id === id ? { ...ap, paymentGuaranteeStatus: 'charge_failed' } : ap
        )
      );
      throw error;
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
            !adminSession ? (
              <AdminLogin
                email={authEmail}
                password={authPassword}
                mode={authMode}
                setEmail={setAuthEmail}
                setPassword={setAuthPassword}
                setMode={setAuthMode}
                onSubmit={handleAdminAuth}
              />
            ) : (
            <DashboardView
              appointments={appointments}
              stylists={stylists}
              currentUserEmail={adminSession?.user?.email}
              onToggleStatus={handleToggleStatus}
              onDeleteAppointment={handleDeleteAppointment}
              onChargeNoShow={handleChargeNoShow}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onOpenBooking={() => setIsBookingOpen(true)}
              onAddAppointment={handleAddNewAppointment}
            />
            )
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
        stylists={stylists}
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

function AdminLogin({
  email,
  password,
  mode,
  setEmail,
  setPassword,
  setMode,
  onSubmit
}: {
  email: string;
  password: string;
  mode: 'login' | 'register';
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setMode: (value: 'login' | 'register') => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="min-h-screen bg-[#fff8f8] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white border border-rose-100 rounded-2xl shadow-sm p-8">
        <h2 className="font-serif text-3xl font-bold text-[#da4d73] mb-2">Acceso admin</h2>
        <p className="text-xs text-stone-500 mb-6">{mode === 'login' ? 'Entra con email y password.' : 'Registro temporal para crear el primer admin.'}</p>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full mb-3 rounded-xl border border-rose-100 px-4 py-3 text-sm outline-[#da4d73]" />
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full mb-5 rounded-xl border border-rose-100 px-4 py-3 text-sm outline-[#da4d73]" />
        <button className="w-full rounded-full bg-[#da4d73] py-3 text-xs font-bold uppercase text-white">{mode === 'login' ? 'Entrar' : 'Crear admin'}</button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="mt-3 w-full text-xs font-bold text-[#da4d73]">
          {mode === 'login' ? 'Crear primer usuario admin' : 'Ya tengo usuario'}
        </button>
      </form>
    </div>
  );
}
