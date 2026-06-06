/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_APPOINTMENTS } from './data';
import { Appointment, Article } from './types';
import ClientPortalView from './components/ClientPortalView';
import DashboardView from './components/DashboardView';
import BookingModal from './components/BookingModal';
import BlogReaderModal from './components/BlogReaderModal';
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
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname.startsWith('/admin'));
  const [visualTheme, setVisualTheme] = useState<'color' | 'mono'>(() => {
    try {
      return window.localStorage.getItem('maria-visual-theme') === 'mono' ? 'mono' : 'color';
    } catch {
      return 'color';
    }
  });
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
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

  useEffect(() => {
    const syncRoute = () => setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
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

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setAdminSession(null);
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
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
      throw new Error('Esta cita no tiene una tarjeta de garantia guardada.');
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
          key={isAdminRoute ? 'admin' : 'client'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="w-full h-full"
        >
          {isAdminRoute ? (
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
              onLogout={handleLogout}
            />
            )
          ) : (
            <ClientPortalView
              onOpenBooking={() => setIsBookingOpen(true)}
              onReadArticle={handleReadArticle}
              visualTheme={visualTheme}
              onToggleVisualTheme={() => setVisualTheme(prev => prev === 'color' ? 'mono' : 'color')}
            />
          )}
        </motion.div>
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
