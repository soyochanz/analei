/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  CreditCard,
  Edit3,
  LayoutGrid,
  MoreVertical,
  Package,
  Plus,
  Save,
  Scissors,
  Settings,
  ShoppingCart,
  Trash2,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { Appointment } from '../types';
import { invokeFunction } from '../lib/supabase';

interface DashboardViewProps {
  appointments: Appointment[];
  stylists: { id: string; name: string; email?: string }[];
  currentUserEmail?: string;
  onToggleStatus: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  onChargeNoShow: (id: string) => Promise<void>;
  onUpdateAppointmentStatus: (id: string, status: Appointment['status'], updates?: Partial<Appointment>) => void;
  onOpenBooking: () => void;
  onAddAppointment: (appointment: Omit<Appointment, 'clientInitials' | 'avatarColor'>) => void;
}

type AdminTab = 'dashboard' | 'clients' | 'catalog' | 'settings' | 'pos' | 'analytics' | 'staff';
type DateFilter = 'today' | 'yesterday' | 'tomorrow' | 'specific' | 'range' | 'all';

type AdminProduct = {
  id?: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  image_url?: string;
  tag?: string;
  stock: number;
  is_active?: boolean;
};

type AdminService = {
  id?: string;
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  price: number;
  icon_name?: string;
  is_active?: boolean;
};

type NoShowPolicy = {
  enabled: boolean;
  charge_type: 'fixed' | 'percentage';
  fixed: number;
  percentage: number;
  cancellation_hours: number;
  policy_text: string;
};

type SalonSettings = {
  salon_name: string;
  phone: string;
  email: string;
  address: string;
  opening_hours: string;
};

type AdminStaff = { id?: string; auth_user_id?: string; stylist_id?: string; name: string; email: string; password?: string; role: string; pin?: string; is_admin?: boolean; is_active?: boolean };
type PosSale = { id: string; appointment_id?: string; client_name?: string; client_email?: string; payment_method: 'cash' | 'card'; total_cents: number; created_at: string };
type PosSaleItem = { id: string; sale_id: string; item_type: 'service' | 'product'; name: string; quantity: number; total_cents: number; created_at: string };
type CashClosure = { id: string; method: 'cash' | 'card' | 'all'; from_at: string; to_at: string; total_cents: number; sale_count: number; created_at: string };
type ClientProfile = { key: string; name: string; email?: string; phone?: string; appointments: Appointment[] };

const eur = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
const today = () => new Date();
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const normalizeText = (value?: string) => (value || '').trim().toLowerCase();
const normalizePhone = (value?: string) => (value || '').replace(/\D/g, '');
const clientIdentityKey = (ap: Pick<Appointment, 'clientName' | 'clientEmail' | 'clientPhone'>) =>
  normalizeText(ap.clientEmail) || normalizePhone(ap.clientPhone) || normalizeText(ap.clientName);

const clientMatches = (ap: Pick<Appointment, 'clientName' | 'clientEmail' | 'clientPhone'>, name?: string, phone?: string, email?: string) => {
  const targetEmail = normalizeText(email);
  const targetPhone = normalizePhone(phone);
  const targetName = normalizeText(name);
  return Boolean(
    (targetEmail && normalizeText(ap.clientEmail) === targetEmail) ||
    (targetPhone && normalizePhone(ap.clientPhone) === targetPhone) ||
    (targetName && normalizeText(ap.clientName).includes(targetName))
  );
};

const buildClientProfiles = (appointments: Appointment[]) => {
  const profiles = new Map<string, ClientProfile>();
  appointments.forEach(ap => {
    const key = clientIdentityKey(ap);
    if (!key) return;
    const existing = profiles.get(key);
    if (existing) {
      existing.appointments.push(ap);
      existing.email ||= ap.clientEmail;
      existing.phone ||= ap.clientPhone;
      return;
    }
    profiles.set(key, { key, name: ap.clientName, email: ap.clientEmail, phone: ap.clientPhone, appointments: [ap] });
  });
  return Array.from(profiles.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const findClientProfiles = (profiles: ClientProfile[], name?: string, phone?: string, email?: string) => {
  const targetEmail = normalizeText(email);
  const targetPhone = normalizePhone(phone);
  const targetName = normalizeText(name);
  if (!targetEmail && !targetPhone && targetName.length < 2) return [];
  return profiles.filter(profile =>
    (targetEmail && normalizeText(profile.email).includes(targetEmail)) ||
    (targetPhone && normalizePhone(profile.phone).includes(targetPhone)) ||
    (targetName && normalizeText(profile.name).includes(targetName))
  );
};

const emptyProduct: AdminProduct = { name: '', brand: '', description: '', price: 0, image_url: '', tag: '', stock: 0, is_active: true };
const emptyService: AdminService = { name: '', description: '', category: 'hair', duration_minutes: 60, price: 0, icon_name: 'Scissors', is_active: true };
const emptyAdminAppointment = { clientName: '', clientEmail: '', clientPhone: '', serviceId: '', stylistId: '', date: isoDate(today()), time: '10:00' };

export default function DashboardView({ appointments, stylists, currentUserEmail, onToggleStatus, onDeleteAppointment, onChargeNoShow, onUpdateAppointmentStatus, onOpenBooking, onAddAppointment }: DashboardViewProps) {
  const now = today();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [staffScope, setStaffScope] = useState<'all' | 'mine'>('all');
  const [specificDate, setSpecificDate] = useState(isoDate(now));
  const [rangeStart, setRangeStart] = useState(isoDate(addDays(now, -7)));
  const [rangeEnd, setRangeEnd] = useState(isoDate(addDays(now, 7)));
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [processingNoShowId, setProcessingNoShowId] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [sales, setSales] = useState<PosSale[]>([]);
  const [saleItems, setSaleItems] = useState<PosSaleItem[]>([]);
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [editingProduct, setEditingProduct] = useState<AdminProduct>(emptyProduct);
  const [editingService, setEditingService] = useState<AdminService>(emptyService);
  const [policy, setPolicy] = useState<NoShowPolicy>({
    enabled: true,
    charge_type: 'fixed',
    fixed: 40,
    percentage: 50,
    cancellation_hours: 24,
    policy_text: 'Si no asistes o cancelas fuera de plazo, se cobrara la penalizacion autorizada al reservar.'
  });
  const [settings, setSettings] = useState<SalonSettings>({
    salon_name: 'Peluqueria Maria y Estetica',
    phone: '',
    email: '',
    address: '',
    opening_hours: ''
  });
  const [editingStaff, setEditingStaff] = useState<AdminStaff>({ name: '', email: '', password: '', role: 'stylist', pin: '', is_admin: false, is_active: true });
  const [adminAppointment, setAdminAppointment] = useState(emptyAdminAppointment);
  const [posCart, setPosCart] = useState<{ id?: string; name: string; price: number; type: string; quantity?: number }[]>([]);
  const [posClient, setPosClient] = useState<{ appointmentId?: string; name: string; email?: string; phone?: string } | null>(null);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [cashCloseout, setCashCloseout] = useState<{ mode: 'consulta' | 'cierre'; method: 'cash' | 'card' | 'all'; sales: PosSale[]; total: number; from?: string; to?: string } | null>(null);

  useEffect(() => {
    invokeFunction<{
      products: any[];
      services: any[];
      staff?: any[];
      sales?: PosSale[];
      saleItems?: PosSaleItem[];
      closures?: CashClosure[];
      settings?: any;
      policy?: any;
    }>('admin-panel', { action: 'load' })
      .then(data => {
        setProducts((data.products || []).filter(p => p.is_active !== false).map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand || '',
          description: p.description || '',
          price: Math.round((p.price_cents || 0) / 100),
          image_url: p.image_url || '',
          tag: p.tag || '',
          stock: p.stock || 0,
          is_active: p.is_active
        })));
        setServices((data.services || []).filter(s => s.is_active !== false).map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          category: s.category || 'hair',
          duration_minutes: s.duration_minutes || 60,
          price: Math.round((s.price_cents || 0) / 100),
          icon_name: s.icon_name || 'Scissors',
          is_active: s.is_active
        })));
        setStaff((data.staff || []).filter(s => s.is_active !== false).map(s => ({
          id: s.id,
          auth_user_id: s.auth_user_id,
          stylist_id: s.stylist_id,
          name: s.name,
          email: s.email,
          role: s.role,
          pin: s.pin || '',
          is_admin: s.is_admin,
          is_active: s.is_active
        })));
        setSales(data.sales || []);
        setSaleItems(data.saleItems || []);
        setClosures(data.closures || []);
        if (data.policy) {
          setPolicy({
            enabled: data.policy.enabled,
            charge_type: data.policy.charge_type,
            fixed: Math.round((data.policy.fixed_cents || 0) / 100),
            percentage: data.policy.percentage || 0,
            cancellation_hours: data.policy.cancellation_hours || 24,
            policy_text: data.policy.policy_text || ''
          });
        }
        if (data.settings) {
          setSettings({
            salon_name: data.settings.salon_name || '',
            phone: data.settings.phone || '',
            email: data.settings.email || '',
            address: data.settings.address || '',
            opening_hours: data.settings.opening_hours || ''
          });
        }
      })
      .catch(error => console.warn('No se pudo cargar administracion:', error));
  }, []);

  const currentStaff = staff.find(s => s.email === currentUserEmail);
  const currentStylist = currentStaff?.stylist_id ? stylists.find(s => s.id === currentStaff.stylist_id) : undefined;

  const filteredAppointments = useMemo(() => {
    const scoped = staffScope === 'mine' && currentStylist ? appointments.filter(ap => ap.stylistId === currentStylist.id) : appointments;
    if (dateFilter === 'all') return scoped;
    const target =
      dateFilter === 'today' ? isoDate(now) :
      dateFilter === 'yesterday' ? isoDate(addDays(now, -1)) :
      dateFilter === 'tomorrow' ? isoDate(addDays(now, 1)) :
      specificDate;
    if (dateFilter === 'range') {
      return scoped.filter(ap => ap.date >= rangeStart && ap.date <= rangeEnd);
    }
    return scoped.filter(ap => ap.date === target);
  }, [appointments, dateFilter, specificDate, rangeStart, rangeEnd, staffScope, currentStylist]);

  const analytics = useMemo(() => {
    const todayIso = isoDate(now);
    const todayAppointments = appointments.filter(ap => ap.date === todayIso);
    const weeklyRevenue = appointments
      .filter(ap => ap.date >= isoDate(addDays(now, -7)) && ap.status !== 'Cancelled')
      .reduce((sum, ap) => sum + ap.price, 0);
    const uniqueClients = new Set(appointments.map(clientIdentityKey)).size;
    const noShowRevenue = appointments
      .filter(ap => ap.paymentGuaranteeStatus === 'charged')
      .reduce((sum, ap) => sum + (ap.noShowFeeAmount || 0), 0);
    return { todayCount: todayAppointments.length, weeklyRevenue, uniqueClients, noShowRevenue };
  }, [appointments]);

  const clientProfiles = useMemo(() => buildClientProfiles(appointments), [appointments]);
  const adminAppointmentMatches = useMemo(
    () => findClientProfiles(clientProfiles, adminAppointment.clientName, adminAppointment.clientPhone, adminAppointment.clientEmail),
    [clientProfiles, adminAppointment.clientName, adminAppointment.clientPhone, adminAppointment.clientEmail]
  );

  const calendarDays = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = addDays(first, -offset);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, []);

  const saveProduct = async () => {
    const { product } = await invokeFunction<{ product: any }>('admin-panel', { action: 'upsert_product', product: editingProduct });
    const normalized = { ...editingProduct, id: product.id };
    setProducts(prev => [normalized, ...prev.filter(p => p.id !== product.id)]);
    setEditingProduct(emptyProduct);
  };

  const saveService = async () => {
    const { service } = await invokeFunction<{ service: any }>('admin-panel', { action: 'upsert_service', service: editingService });
    const normalized = { ...editingService, id: service.id };
    setServices(prev => [normalized, ...prev.filter(s => s.id !== service.id)]);
    setEditingService(emptyService);
  };

  const removeProduct = async (id?: string) => {
    if (!id) return;
    await invokeFunction('admin-panel', { action: 'delete_product', id });
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const removeService = async (id?: string) => {
    if (!id) return;
    await invokeFunction('admin-panel', { action: 'delete_service', id });
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const savePolicy = async () => {
    await invokeFunction('admin-panel', { action: 'save_policy', policy });
    alert('Politica no-show guardada.');
  };

  const saveSettings = async () => {
    await invokeFunction('admin-panel', { action: 'save_settings', settings });
    alert('Ajustes de salon guardados.');
  };

  const saveStaff = async () => {
    const { staff: saved } = await invokeFunction<{ staff: any }>('admin-panel', { action: 'upsert_staff', staff: editingStaff });
    setStaff(prev => [{ ...editingStaff, id: saved.id, auth_user_id: saved.auth_user_id, password: '' }, ...prev.filter(s => s.id !== saved.id)]);
    setEditingStaff({ name: '', email: '', password: '', role: 'stylist', pin: '', is_admin: false, is_active: true });
  };

  const applyClientProfile = (profile: ClientProfile) => {
    setAdminAppointment(ap => ({
      ...ap,
      clientName: profile.name,
      clientEmail: profile.email || ap.clientEmail,
      clientPhone: profile.phone || ap.clientPhone
    }));
  };

  const createAdminAppointment = async () => {
    if (!adminAppointment.clientName.trim()) return alert('Pon al menos el nombre del cliente.');
    if (!adminAppointment.serviceId) return alert('Selecciona un servicio.');
    const selectedService = services.find(service => service.id === adminAppointment.serviceId);
    const selectedStylist = stylists.find(stylist => stylist.id === adminAppointment.stylistId);
    const { appointment } = await invokeFunction<{ appointment: any }>('admin-panel', {
      action: 'create_appointment',
      appointment: adminAppointment
    });
    onAddAppointment({
      id: appointment.id,
      clientName: appointment.client_name,
      clientEmail: appointment.client_email || undefined,
      clientPhone: appointment.client_phone || undefined,
      service: appointment.service_name,
      stylistId: appointment.stylist_id || undefined,
      stylistName: selectedStylist?.name,
      time: appointment.appointment_time,
      date: appointment.appointment_date,
      status: appointment.status,
      price: Math.round(appointment.price_cents / 100),
      paymentGuaranteeStatus: appointment.payment_guarantee_status,
      noShowFeeAmount: Math.round((appointment.no_show_fee_cents || 0) / 100)
    });
    setAdminAppointment({ ...emptyAdminAppointment, serviceId: selectedService?.id || '' });
    alert('Cita walk-in creada sin tarjeta.');
  };

  const removeStaff = async (id?: string) => {
    if (!id) return;
    await invokeFunction('admin-panel', { action: 'delete_staff', id });
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const chargeNoShow = async (ap: Appointment) => {
    if (!ap.stripeCustomerId || !ap.stripePaymentMethodId) {
      alert('Esta reserva no tiene tarjeta guardada. Solo puedes cobrar no-show en reservas creadas con Stripe.');
      return;
    }
    if (ap.paymentGuaranteeStatus === 'charged') {
      alert('Esta reserva ya tiene el no-show cobrado.');
      return;
    }
    if (!window.confirm(`Marcar a ${ap.clientName} como no-show y cobrar ${eur(ap.noShowFeeAmount || 0)}?`)) return;
    setProcessingNoShowId(ap.id);
    try {
      await onChargeNoShow(ap.id);
    } finally {
      setProcessingNoShowId(null);
      setActiveMenuId(null);
    }
  };

  const updateAppointmentStatus = async (ap: Appointment, status: Appointment['status']) => {
    const { appointment } = await invokeFunction<{ appointment: any }>('admin-panel', {
      action: 'update_appointment_status',
      appointmentId: ap.id,
      status
    });
    onUpdateAppointmentStatus(ap.id, appointment.status);
  };

  const posNoShow = async (ap: Appointment) => {
    if (ap.stripeCustomerId && ap.stripePaymentMethodId && ap.paymentGuaranteeStatus !== 'charged') {
      await chargeNoShow(ap);
      return;
    }
    if (ap.status === 'NoShow') return alert('Esta cita ya esta marcada como no-show.');
    if (!window.confirm(`Marcar a ${ap.clientName} como no-show sin cargo de tarjeta?`)) return;
    await updateAppointmentStatus(ap, 'NoShow');
  };

  const posTotal = posCart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const todayAppointments = appointments.filter(ap => ap.date === isoDate(now) && (staffScope === 'all' || !currentStylist || ap.stylistId === currentStylist.id));

  const completePosSale = async (paymentMethod: 'cash' | 'card') => {
    if (!posCart.length) return alert('Anade productos o servicios al ticket.');
    const { sale } = await invokeFunction<{ sale: PosSale }>('admin-panel', {
      action: 'create_sale',
      sale: {
        appointmentId: posClient?.appointmentId,
        clientName: posClient?.name,
        clientEmail: posClient?.email,
        paymentMethod
      },
      items: posCart
    });
    setSales(prev => [sale, ...prev]);
    setSaleItems(prev => [
      ...posCart.map((item, index) => ({
        id: `${sale.id}-${index}`,
        sale_id: sale.id,
        item_type: item.type === 'Producto' ? 'product' as const : 'service' as const,
        name: item.name,
        quantity: item.quantity || 1,
        total_cents: Math.round(item.price * (item.quantity || 1) * 100),
        created_at: sale.created_at
      })),
      ...prev
    ]);
    setPosCart([]);
    alert(`Cobro registrado: ${eur(posTotal)} (${paymentMethod === 'cash' ? 'cash' : 'tarjeta'})`);
  };

  const viewRegister = (method: 'cash' | 'card' | 'all') => {
    const day = isoDate(now);
    const filtered = (method === 'all' ? sales : sales.filter(s => s.payment_method === method)).filter(s => s.created_at.slice(0, 10) === day);
    const total = filtered.reduce((sum, sale) => sum + sale.total_cents / 100, 0);
    setCashCloseout({ mode: 'consulta', method, sales: filtered, total, from: `${day}T00:00:00`, to: new Date().toISOString() });
  };

  const closeRegister = async (method: 'cash' | 'card' | 'all') => {
    const { closure, sales: closedSales } = await invokeFunction<{ closure: CashClosure; sales: PosSale[] }>('admin-panel', { action: 'close_register', method });
    setClosures(prev => [closure, ...prev]);
    setCashCloseout({
      mode: 'cierre',
      method,
      sales: closedSales,
      total: closure.total_cents / 100,
      from: closure.from_at,
      to: closure.to_at
    });
  };

  return (
    <div className="min-h-screen bg-[#fffbfb] text-stone-900 md:pl-64">
      <aside className="fixed left-0 top-0 hidden md:flex h-screen w-64 flex-col border-r border-rose-100 bg-white p-5 shadow-sm">
        <div className="mb-6 px-2 py-4">
          <h1 className="font-serif text-3xl font-bold text-[#da4d73]">Maria</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Admin Portal</p>
        </div>
        <nav className="flex flex-col gap-2 text-xs font-bold">
          <NavButton active={activeTab === 'dashboard'} icon={<CalendarDays className="w-4 h-4" />} label="Agenda" onClick={() => setActiveTab('dashboard')} />
          <NavButton active={activeTab === 'clients'} icon={<Users className="w-4 h-4" />} label="Fichas clientes" onClick={() => setActiveTab('clients')} />
          <NavButton active={activeTab === 'analytics'} icon={<LayoutGrid className="w-4 h-4" />} label="Analiticas" onClick={() => setActiveTab('analytics')} />
          <NavButton active={activeTab === 'catalog'} icon={<Package className="w-4 h-4" />} label="Productos y servicios" onClick={() => setActiveTab('catalog')} />
          <NavButton active={activeTab === 'staff'} icon={<Users className="w-4 h-4" />} label="Peluqueros" onClick={() => setActiveTab('staff')} />
          <NavButton active={activeTab === 'settings'} icon={<Settings className="w-4 h-4" />} label="Ajustes y no-show" onClick={() => setActiveTab('settings')} />
          <NavButton active={activeTab === 'pos'} icon={<ShoppingCart className="w-4 h-4" />} label="POS tactil" onClick={() => setActiveTab('pos')} />
        </nav>
        <button onClick={onOpenBooking} className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#da4d73] px-4 py-3 text-xs font-bold uppercase text-white">
          <Plus className="w-4 h-4" /> Nueva reserva
        </button>
      </aside>

      <main className="p-5 pt-8 md:p-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-rose-100 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#da4d73]">{now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <h2 className="font-serif text-3xl font-bold">Panel de control</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <MobileTab active={activeTab === 'dashboard'} label="Agenda" onClick={() => setActiveTab('dashboard')} />
            <MobileTab active={activeTab === 'catalog'} label="Catalogo" onClick={() => setActiveTab('catalog')} />
            <MobileTab active={activeTab === 'settings'} label="Ajustes" onClick={() => setActiveTab('settings')} />
            <MobileTab active={activeTab === 'pos'} label="POS" onClick={() => setActiveTab('pos')} />
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <>
            <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Metric icon={<Scissors className="w-5 h-5" />} label="Citas hoy" value={String(analytics.todayCount)} />
              <Metric icon={<CreditCard className="w-5 h-5" />} label="Caja semana" value={eur(analytics.weeklyRevenue)} />
              <Metric icon={<UserPlus className="w-5 h-5" />} label="Clientes" value={String(analytics.uniqueClients)} />
              <Metric icon={<ShoppingCart className="w-5 h-5" />} label="No-show cobrado" value={eur(analytics.noShowRevenue)} />
            </section>

            <section className="mb-5 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-end gap-3">
                <Select label="Vista" value={dateFilter} onChange={value => setDateFilter(value as DateFilter)}>
                  <option value="today">Hoy</option>
                  <option value="yesterday">Ayer</option>
                  <option value="tomorrow">Manana</option>
                  <option value="specific">Dia concreto</option>
                  <option value="range">Franja de dias</option>
                  <option value="all">Todas</option>
                </Select>
                <Select label="Profesional" value={staffScope} onChange={value => setStaffScope(value as 'all' | 'mine')}>
                  <option value="all">Todas</option>
                  <option value="mine">Solo las mias</option>
                </Select>
                {dateFilter === 'specific' && <Field label="Dia" type="date" value={specificDate} onChange={setSpecificDate} />}
                {dateFilter === 'range' && (
                  <>
                    <Field label="Desde" type="date" value={rangeStart} onChange={setRangeStart} />
                    <Field label="Hasta" type="date" value={rangeEnd} onChange={setRangeEnd} />
                  </>
                )}
                <button onClick={onOpenBooking} className="rounded-full bg-[#da4d73] px-5 py-3 text-xs font-bold uppercase text-white">Nueva cita online</button>
              </div>
            </section>

            <section className="mb-5 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold">Crear walk-in / cita admin</h3>
                  <p className="text-xs text-stone-500">Sin tarjeta ni Stripe. Busca ficha por nombre, telefono o email.</p>
                </div>
                <button onClick={createAdminAppointment} className="rounded-full bg-stone-900 px-5 py-3 text-xs font-bold uppercase text-white">Guardar cita</button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Field label="Nombre cliente" value={adminAppointment.clientName} onChange={v => setAdminAppointment(ap => ({ ...ap, clientName: v }))} />
                <Field label="Telefono" value={adminAppointment.clientPhone} onChange={v => setAdminAppointment(ap => ({ ...ap, clientPhone: v }))} />
                <Field label="Email" value={adminAppointment.clientEmail} onChange={v => setAdminAppointment(ap => ({ ...ap, clientEmail: v }))} />
                <Select label="Servicio" value={adminAppointment.serviceId} onChange={v => setAdminAppointment(ap => ({ ...ap, serviceId: v }))}>
                  <option value="">Seleccionar</option>
                  {services.map(service => <option key={service.id} value={service.id}>{service.name} - {eur(service.price)}</option>)}
                </Select>
                <Select label="Peluquero" value={adminAppointment.stylistId} onChange={v => setAdminAppointment(ap => ({ ...ap, stylistId: v }))}>
                  <option value="">Cualquiera</option>
                  {stylists.map(stylist => <option key={stylist.id} value={stylist.id}>{stylist.name}</option>)}
                </Select>
                <Field label="Fecha" type="date" value={adminAppointment.date} onChange={v => setAdminAppointment(ap => ({ ...ap, date: v }))} />
                <Field label="Hora" type="time" value={adminAppointment.time} onChange={v => setAdminAppointment(ap => ({ ...ap, time: v }))} />
              </div>
              {adminAppointmentMatches.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {adminAppointmentMatches.slice(0, 5).map(profile => (
                    <button key={profile.key} onClick={() => applyClientProfile(profile)} className="rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-stone-700">
                      {profile.name} · {profile.email || profile.phone || `${profile.appointments.length} citas`}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <DailyStylistCalendar
              date={dateFilter === 'specific' ? specificDate : isoDate(now)}
              stylists={stylists}
              appointments={filteredAppointments}
            />

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-8 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-serif text-xl font-bold">Listado de citas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-rose-100 text-[10px] uppercase tracking-widest text-stone-400">
                      <tr><th className="py-3">Cliente</th><th>Servicio</th><th>Fecha</th><th>Estado</th><th className="text-right">Acciones</th></tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map(ap => (
                        <tr key={ap.id} className="border-b border-rose-50">
                          <td className="py-4 font-bold">{ap.clientName}<span className="block text-[10px] font-medium text-stone-400">{ap.clientEmail || ap.clientPhone || 'Sin contacto'}</span></td>
                          <td>{ap.service}<span className="block text-[10px] text-stone-400">{eur(ap.price)} · {ap.stylistName || 'Cualquiera'}</span></td>
                          <td><b>{ap.time}</b><span className="block text-[10px] text-stone-400">{ap.date}</span></td>
                          <td><Status appointment={ap} /></td>
                          <td className="relative text-right">
                            <div className="inline-flex items-center gap-1">
                              {ap.status === 'Pending' && <IconButton title="Confirmar" onClick={() => onToggleStatus(ap.id)}><Check className="w-4 h-4" /></IconButton>}
                              {ap.stripeCustomerId && ap.paymentGuaranteeStatus !== 'charged' && (
                                <button onClick={() => chargeNoShow(ap)} disabled={processingNoShowId === ap.id} className="rounded-lg border border-purple-100 px-2.5 py-1.5 text-[10px] font-bold uppercase text-purple-700 disabled:opacity-50">
                                  {processingNoShowId === ap.id ? 'Cobrando' : 'No-show'}
                                </button>
                              )}
                              <IconButton title="Menu" onClick={() => setActiveMenuId(activeMenuId === ap.id ? null : ap.id)}><MoreVertical className="w-4 h-4" /></IconButton>
                            </div>
                            {activeMenuId === ap.id && (
                              <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-rose-100 bg-white p-1.5 text-left shadow-xl">
                                <MenuAction onClick={() => onToggleStatus(ap.id)}>Cambiar estado</MenuAction>
                                <MenuAction onClick={() => chargeNoShow(ap)}>Marcar no-show y cobrar</MenuAction>
                                <MenuAction danger onClick={() => onDeleteAppointment(ap.id)}>Eliminar cita</MenuAction>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="xl:col-span-4 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-serif text-xl font-bold">{now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(day => <div key={day} className="py-1 font-bold text-stone-400">{day}</div>)}
                  {calendarDays.map(day => {
                    const date = isoDate(day);
                    const isCurrentMonth = day.getMonth() === now.getMonth();
                    const isToday = date === isoDate(now);
                    const hasAppointment = appointments.some(ap => ap.date === date);
                    return (
                      <button key={date} onClick={() => { setSpecificDate(date); setDateFilter('specific'); }} className={`relative rounded-lg py-3 font-bold ${!isCurrentMonth ? 'text-stone-300' : isToday ? 'bg-[#da4d73] text-white' : 'hover:bg-rose-50'}`}>
                        {day.getDate()}
                        {hasAppointment && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${isToday ? 'bg-white' : 'bg-[#da4d73]'}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'clients' && <ClientsView appointments={appointments} />}
        {activeTab === 'analytics' && <AnalyticsView sales={sales} saleItems={saleItems} appointments={appointments} />}
        {activeTab === 'catalog' && (
          <CatalogView
            products={products}
            services={services}
            editingProduct={editingProduct}
            editingService={editingService}
            setEditingProduct={setEditingProduct}
            setEditingService={setEditingService}
            saveProduct={saveProduct}
            saveService={saveService}
            removeProduct={removeProduct}
            removeService={removeService}
          />
        )}
        {activeTab === 'settings' && <SettingsView policy={policy} settings={settings} setPolicy={setPolicy} setSettings={setSettings} savePolicy={savePolicy} saveSettings={saveSettings} />}
        {activeTab === 'staff' && <StaffView staff={staff} editingStaff={editingStaff} setEditingStaff={setEditingStaff} saveStaff={saveStaff} removeStaff={removeStaff} />}
        {activeTab === 'pos' && <PosView services={services} products={products} cart={posCart} setCart={setPosCart} total={posTotal} appointmentsToday={todayAppointments} appointments={appointments} posClient={posClient} setPosClient={setPosClient} completeSale={completePosSale} closeRegister={closeRegister} viewRegister={viewRegister} sales={sales} saleItems={saleItems} manualItemName={manualItemName} manualItemPrice={manualItemPrice} setManualItemName={setManualItemName} setManualItemPrice={setManualItemPrice} closeout={cashCloseout} setCloseout={setCashCloseout} closures={closures} updateAppointmentStatus={updateAppointmentStatus} chargeNoShow={posNoShow} />}
      </main>
    </div>
  );
}

function DailyStylistCalendar({ date, stylists, appointments }: { date: string; stylists: { id: string; name: string }[]; appointments: Appointment[] }) {
  const rows = [{ id: '', name: 'Sin asignar / cualquiera' }, ...stylists];
  return (
    <section className="mb-6 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold">Calendario diario · {date}</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Fila por peluquero</span>
      </div>
      <div className="space-y-3">
        {rows.map(row => {
          const rowAppointments = appointments.filter(ap => ap.date === date && (row.id ? ap.stylistId === row.id : !ap.stylistId));
          return (
            <div key={row.id || 'any'} className="grid gap-3 rounded-xl border border-rose-50 bg-rose-50/20 p-3 md:grid-cols-[160px_1fr]">
              <div className="font-bold text-sm text-stone-800">{row.name}</div>
              <div className="flex min-h-14 flex-wrap gap-2">
                {rowAppointments.length === 0 ? <span className="text-xs text-stone-400">Sin citas</span> : rowAppointments.map(ap => (
                  <div key={ap.id} className="rounded-xl bg-white px-3 py-2 text-xs shadow-sm border border-rose-100">
                    <b>{ap.time}</b> · {ap.clientName}
                    <span className="block text-[10px] text-stone-400">{ap.service}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left ${active ? 'bg-rose-50 text-[#da4d73]' : 'text-stone-500 hover:bg-rose-50/60'}`}>{icon}{label}</button>;
}

function MobileTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase ${active ? 'bg-[#da4d73] text-white' : 'bg-white text-stone-500 border border-rose-100'}`}>{label}</button>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#da4d73]">{icon}</div><p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p><p className="mt-1 font-serif text-3xl font-bold">{value}</p></div>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}<input type={type} value={value} onChange={e => onChange(e.target.value)} className="mt-1 block rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs text-stone-800 outline-[#da4d73]" /></label>;
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}<select value={value} onChange={e => onChange(e.target.value)} className="mt-1 block rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs text-stone-800 outline-[#da4d73]">{children}</select></label>;
}

function IconButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return <button title={title} onClick={onClick} className="rounded-lg border border-rose-100 p-1.5 text-stone-500 hover:bg-rose-50">{children}</button>;
}

function MenuAction({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`block w-full rounded-lg px-3 py-2 text-left text-[11px] font-bold ${danger ? 'text-rose-600 hover:bg-rose-50' : 'text-stone-700 hover:bg-rose-50'}`}>{children}</button>;
}

function Status({ appointment }: { appointment: Appointment }) {
  const label = appointment.status === 'NoShow' ? 'No-show' : appointment.status === 'Confirmed' ? 'Confirmada' : appointment.status === 'Cancelled' ? 'Cancelada' : 'Pendiente';
  return <div className="flex flex-col gap-1"><span className="w-fit rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-[#da4d73]">{label}</span>{appointment.paymentGuaranteeStatus === 'charged' && <span className="w-fit rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-700">No-show cobrado</span>}{appointment.paymentGuaranteeStatus === 'secured' && <span className="w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Tarjeta guardada</span>}</div>;
}

function ClientsView({ appointments }: { appointments: Appointment[] }) {
  const clients = buildClientProfiles(appointments);
  return <Panel title="Fichas de clientes"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{clients.map(client => <div key={client.key} className="rounded-xl border border-rose-100 p-4"><p className="font-bold">{client.name}</p><p className="text-xs text-stone-500">{client.email || 'Sin email'}{client.phone ? ` · ${client.phone}` : ''}</p><p className="mt-2 text-[10px] uppercase tracking-widest text-stone-400">{client.appointments.length} citas encontradas por nombre, telefono o email</p><div className="mt-3 max-h-28 space-y-1 overflow-auto">{client.appointments.slice(0, 5).map(ap => <div key={ap.id} className="rounded-lg bg-rose-50 px-2 py-1 text-[11px]">{ap.date} · {ap.service}</div>)}</div></div>)}</div></Panel>;
}

function CatalogView(props: {
  products: AdminProduct[]; services: AdminService[]; editingProduct: AdminProduct; editingService: AdminService;
  setEditingProduct: React.Dispatch<React.SetStateAction<AdminProduct>>; setEditingService: React.Dispatch<React.SetStateAction<AdminService>>;
  saveProduct: () => Promise<void>; saveService: () => Promise<void>; removeProduct: (id?: string) => Promise<void>; removeService: (id?: string) => Promise<void>;
}) {
  return <div className="grid gap-6 xl:grid-cols-2">
    <Panel title="Productos tienda">
      <Editor title="Producto" onSave={props.saveProduct} onNew={() => props.setEditingProduct(emptyProduct)}>
        <Field label="Nombre" value={props.editingProduct.name} onChange={v => props.setEditingProduct(p => ({ ...p, name: v }))} />
        <Field label="Marca" value={props.editingProduct.brand} onChange={v => props.setEditingProduct(p => ({ ...p, brand: v }))} />
        <Field label="Precio EUR" type="number" value={props.editingProduct.price} onChange={v => props.setEditingProduct(p => ({ ...p, price: Number(v) }))} />
        <Field label="Stock" type="number" value={props.editingProduct.stock} onChange={v => props.setEditingProduct(p => ({ ...p, stock: Number(v) }))} />
        <Field label="Imagen URL" value={props.editingProduct.image_url || ''} onChange={v => props.setEditingProduct(p => ({ ...p, image_url: v }))} />
      </Editor>
      <List items={props.products} onEdit={props.setEditingProduct} onDelete={props.removeProduct} />
    </Panel>
    <Panel title="Servicios">
      <Editor title="Servicio" onSave={props.saveService} onNew={() => props.setEditingService(emptyService)}>
        <Field label="Nombre" value={props.editingService.name} onChange={v => props.setEditingService(s => ({ ...s, name: v }))} />
        <Field label="Categoria" value={props.editingService.category} onChange={v => props.setEditingService(s => ({ ...s, category: v }))} />
        <Field label="Precio EUR" type="number" value={props.editingService.price} onChange={v => props.setEditingService(s => ({ ...s, price: Number(v) }))} />
        <Field label="Duracion min" type="number" value={props.editingService.duration_minutes} onChange={v => props.setEditingService(s => ({ ...s, duration_minutes: Number(v) }))} />
        <Field label="Descripcion" value={props.editingService.description} onChange={v => props.setEditingService(s => ({ ...s, description: v }))} />
      </Editor>
      <List items={props.services} onEdit={props.setEditingService} onDelete={props.removeService} />
    </Panel>
  </div>;
}

function Editor({ title, children, onSave, onNew }: { title: string; children: React.ReactNode; onSave: () => Promise<void>; onNew: () => void }) {
  return <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50/20 p-4"><div className="mb-3 flex items-center justify-between"><h4 className="font-bold">{title}</h4><button onClick={onNew} className="rounded-lg border border-rose-100 bg-white p-2"><X className="w-4 h-4" /></button></div><div className="grid gap-3 md:grid-cols-2">{children}</div><button onClick={onSave} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#da4d73] px-4 py-2 text-xs font-bold uppercase text-white"><Save className="w-4 h-4" /> Guardar</button></div>;
}

function List<T extends { id?: string; name: string; price: number; brand?: string; duration_minutes?: number; stock?: number }>({ items, onEdit, onDelete }: { items: T[]; onEdit: (item: T) => void; onDelete: (id?: string) => void }) {
  return <div className="space-y-2">{items.map(item => <div key={item.id || item.name} className="flex items-center justify-between rounded-xl border border-rose-100 p-3"><div><p className="font-bold">{item.name}</p><p className="text-xs text-stone-500">{item.brand || `${item.duration_minutes || 0} min`} · {eur(item.price)} {typeof item.stock === 'number' ? `· Stock ${item.stock}` : ''}</p></div><div className="flex gap-1"><IconButton title="Editar" onClick={() => onEdit(item)}><Edit3 className="w-4 h-4" /></IconButton><IconButton title="Eliminar" onClick={() => onDelete(item.id)}><Trash2 className="w-4 h-4" /></IconButton></div></div>)}</div>;
}

function SettingsView({ policy, settings, setPolicy, setSettings, savePolicy, saveSettings }: { policy: NoShowPolicy; settings: SalonSettings; setPolicy: React.Dispatch<React.SetStateAction<NoShowPolicy>>; setSettings: React.Dispatch<React.SetStateAction<SalonSettings>>; savePolicy: () => Promise<void>; saveSettings: () => Promise<void> }) {
  return <div className="grid gap-6 xl:grid-cols-2">
    <Panel title="Politica no-show">
      <div className="grid gap-3 md:grid-cols-2">
        <Select label="Tipo de cargo" value={policy.charge_type} onChange={v => setPolicy(p => ({ ...p, charge_type: v as NoShowPolicy['charge_type'] }))}><option value="fixed">Fijo</option><option value="percentage">Porcentaje</option></Select>
        <Field label="Horas cancelacion" type="number" value={policy.cancellation_hours} onChange={v => setPolicy(p => ({ ...p, cancellation_hours: Number(v) }))} />
        <Field label="Monto fijo EUR" type="number" value={policy.fixed} onChange={v => setPolicy(p => ({ ...p, fixed: Number(v) }))} />
        <Field label="Porcentaje %" type="number" value={policy.percentage} onChange={v => setPolicy(p => ({ ...p, percentage: Number(v) }))} />
      </div>
      <textarea value={policy.policy_text} onChange={e => setPolicy(p => ({ ...p, policy_text: e.target.value }))} className="mt-3 h-28 w-full rounded-xl border border-rose-100 p-3 text-sm outline-[#da4d73]" />
      <button onClick={savePolicy} className="mt-3 rounded-full bg-[#da4d73] px-5 py-2 text-xs font-bold uppercase text-white">Guardar politica</button>
    </Panel>
    <Panel title="Ajustes de salon">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre" value={settings.salon_name} onChange={v => setSettings(s => ({ ...s, salon_name: v }))} />
        <Field label="Telefono" value={settings.phone} onChange={v => setSettings(s => ({ ...s, phone: v }))} />
        <Field label="Email" value={settings.email} onChange={v => setSettings(s => ({ ...s, email: v }))} />
        <Field label="Direccion" value={settings.address} onChange={v => setSettings(s => ({ ...s, address: v }))} />
      </div>
      <textarea value={settings.opening_hours} onChange={e => setSettings(s => ({ ...s, opening_hours: e.target.value }))} placeholder="Horario" className="mt-3 h-28 w-full rounded-xl border border-rose-100 p-3 text-sm outline-[#da4d73]" />
      <button onClick={saveSettings} className="mt-3 rounded-full bg-[#da4d73] px-5 py-2 text-xs font-bold uppercase text-white">Guardar ajustes</button>
    </Panel>
  </div>;
}

function PosView({
  services, products, cart, setCart, total, appointmentsToday, appointments, posClient, setPosClient, completeSale, closeRegister, viewRegister, sales, saleItems, manualItemName, manualItemPrice, setManualItemName, setManualItemPrice, closeout, setCloseout, closures, updateAppointmentStatus, chargeNoShow
}: {
  services: AdminService[];
  products: AdminProduct[];
  cart: { id?: string; name: string; price: number; type: string; quantity?: number }[];
  setCart: React.Dispatch<React.SetStateAction<{ id?: string; name: string; price: number; type: string; quantity?: number }[]>>;
  total: number;
  appointmentsToday: Appointment[];
  appointments: Appointment[];
  posClient: { appointmentId?: string; name: string; email?: string; phone?: string } | null;
  setPosClient: React.Dispatch<React.SetStateAction<{ appointmentId?: string; name: string; email?: string; phone?: string } | null>>;
  completeSale: (method: 'cash' | 'card') => Promise<void>;
  closeRegister: (method: 'cash' | 'card' | 'all') => Promise<void>;
  viewRegister: (method: 'cash' | 'card' | 'all') => void;
  sales: PosSale[];
  saleItems: PosSaleItem[];
  manualItemName: string;
  manualItemPrice: string;
  setManualItemName: (value: string) => void;
  setManualItemPrice: (value: string) => void;
  closeout: { mode: 'consulta' | 'cierre'; method: 'cash' | 'card' | 'all'; sales: PosSale[]; total: number; from?: string; to?: string } | null;
  setCloseout: React.Dispatch<React.SetStateAction<{ mode: 'consulta' | 'cierre'; method: 'cash' | 'card' | 'all'; sales: PosSale[]; total: number; from?: string; to?: string } | null>>;
  closures: CashClosure[];
  updateAppointmentStatus: (appointment: Appointment, status: Appointment['status']) => Promise<void>;
  chargeNoShow: (appointment: Appointment) => Promise<void>;
}) {
  const items = [
    ...services.map(s => ({ id: s.id, name: s.name, price: s.price, type: 'Servicio' })),
    ...products.map(p => ({ id: p.id, name: p.name, price: p.price, type: 'Producto' }))
  ];
  const clientKey = posClient?.email || posClient?.phone || posClient?.name;
  const clientAppointments = clientKey ? appointments.filter(ap => clientMatches(ap, posClient?.name, posClient?.phone, posClient?.email)) : [];
  const clientSales = clientKey ? sales.filter(sale => {
    const saleEmail = normalizeText(sale.client_email);
    const saleName = normalizeText(sale.client_name);
    return Boolean((posClient?.email && saleEmail === normalizeText(posClient.email)) || (posClient?.name && saleName === normalizeText(posClient.name)));
  }) : [];
  const clientSaleIds = new Set(clientSales.map(sale => sale.id));
  const clientItems = saleItems.filter(item => clientSaleIds.has(item.sale_id));
  const selectedAppointment = posClient?.appointmentId ? appointments.find(ap => ap.id === posClient.appointmentId) : undefined;
  const removeCartItem = (targetIndex: number) => setCart(prev => prev.filter((_item, index) => index !== targetIndex));
  const addManualItem = () => {
    const price = Number(manualItemPrice);
    if (!manualItemName.trim() || !price) return;
    setCart(prev => [...prev, { name: manualItemName.trim(), price, type: 'Manual', quantity: 1 }]);
    setManualItemName('');
    setManualItemPrice('');
  };

  return <div className="grid min-h-[78vh] gap-6 xl:grid-cols-12">
    <div className="xl:col-span-3 rounded-2xl border border-rose-100 bg-white p-4">
      <h3 className="mb-4 font-serif text-2xl font-bold">Clientes hoy</h3>
      <button onClick={() => setPosClient(null)} className={`mb-2 w-full rounded-xl p-3 text-left text-sm font-bold ${!posClient ? 'bg-[#da4d73] text-white' : 'bg-rose-50'}`}>Mostrador</button>
      <div className="space-y-2">{appointmentsToday.map(ap => <button key={ap.id} onClick={() => setPosClient({ appointmentId: ap.id, name: ap.clientName, email: ap.clientEmail, phone: ap.clientPhone })} className={`w-full rounded-xl p-3 text-left text-sm font-bold ${posClient?.appointmentId === ap.id ? 'bg-[#da4d73] text-white' : 'bg-rose-50/60'}`}><span>{ap.clientName}</span><span className="block text-[10px] opacity-70">{ap.time} · {ap.service}</span></button>)}</div>
      {posClient && (
        <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#da4d73]">Ficha cliente</p>
          <h4 className="font-serif text-xl font-bold">{posClient.name}</h4>
          <p className="text-xs text-stone-500">{posClient.email || 'Sin email'}{posClient.phone ? ` · ${posClient.phone}` : ''}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-white p-2"><b>{clientAppointments.length}</b><span className="block text-[10px] text-stone-400">citas</span></div>
            <div className="rounded-xl bg-white p-2"><b>{clientSales.length}</b><span className="block text-[10px] text-stone-400">compras</span></div>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Citas pasadas</p>
          <div className="mt-2 max-h-28 space-y-1 overflow-auto">{clientAppointments.slice(0, 6).map(ap => <div key={ap.id} className="rounded-lg bg-white px-2 py-1 text-[11px]">{ap.date} · {ap.service}</div>)}</div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Compras previas</p>
          <div className="mt-2 max-h-28 space-y-1 overflow-auto">{clientItems.slice(0, 8).map(item => <div key={item.id} className="rounded-lg bg-white px-2 py-1 text-[11px]">{item.name} · {eur(item.total_cents / 100)}</div>)}</div>
        </div>
      )}
      {selectedAppointment && (
        <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Acciones cita</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => updateAppointmentStatus(selectedAppointment, 'Confirmed')} className="min-h-16 rounded-2xl bg-emerald-600 px-3 py-3 text-sm font-black uppercase text-white active:scale-95">Confirmar</button>
            <button onClick={() => updateAppointmentStatus(selectedAppointment, 'Pending')} className="min-h-16 rounded-2xl bg-amber-500 px-3 py-3 text-sm font-black uppercase text-white active:scale-95">Pendiente</button>
            <button onClick={() => updateAppointmentStatus(selectedAppointment, 'Cancelled')} className="min-h-16 rounded-2xl bg-stone-800 px-3 py-3 text-sm font-black uppercase text-white active:scale-95">Cancelar</button>
            <button onClick={() => chargeNoShow(selectedAppointment)} className="min-h-16 rounded-2xl bg-[#da4d73] px-3 py-3 text-sm font-black uppercase text-white active:scale-95">
              {selectedAppointment.stripeCustomerId && selectedAppointment.paymentGuaranteeStatus !== 'charged' ? 'Cobrar no-show' : 'No-show'}
            </button>
          </div>
          <div className="mt-3"><Status appointment={selectedAppointment} /></div>
        </div>
      )}
    </div>
    <div className="xl:col-span-5 rounded-2xl border border-rose-100 bg-white p-5">
      <h3 className="mb-4 font-serif text-3xl font-bold">POS tactil</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{items.map(item => <button key={`${item.type}-${item.id || item.name}`} onClick={() => setCart(prev => [...prev, { ...item, quantity: 1 }])} className="min-h-36 rounded-2xl border border-rose-100 bg-rose-50/30 p-4 text-left text-lg font-bold active:scale-95"><LayoutGrid className="mb-3 w-6 h-6 text-[#da4d73]" />{item.name}<span className="mt-3 block text-xl text-[#da4d73]">{eur(item.price)}</span><span className="text-[10px] uppercase tracking-widest text-stone-400">{item.type}</span></button>)}</div>
      <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-500">Entrada manual</p>
        <div className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
          <input value={manualItemName} onChange={e => setManualItemName(e.target.value)} placeholder="Nombre concepto" className="rounded-xl border border-rose-100 px-3 py-3 text-sm outline-[#da4d73]" />
          <input value={manualItemPrice} onChange={e => setManualItemPrice(e.target.value)} type="number" placeholder="Precio" className="rounded-xl border border-rose-100 px-3 py-3 text-sm outline-[#da4d73]" />
          <button onClick={addManualItem} className="rounded-xl bg-stone-900 px-5 py-3 text-xs font-bold uppercase text-white">Anadir</button>
        </div>
      </div>
    </div>
    <div className="xl:col-span-4 rounded-2xl border border-rose-100 bg-white p-5">
      <h3 className="font-serif text-3xl font-bold">Ticket</h3>
      <p className="mb-4 text-xs font-bold text-[#da4d73]">{posClient ? posClient.name : 'Venta mostrador'}</p>
      <div className="space-y-2">{cart.map((item, index) => <button key={`${item.name}-${index}`} onClick={() => removeCartItem(index)} className="flex w-full items-center justify-between rounded-xl bg-rose-50/40 p-3 text-left text-sm active:scale-[0.99]"><span><b>{item.name}</b><span className="block text-[10px] font-bold uppercase tracking-widest text-stone-400">Tocar para eliminar</span></span><b>{eur(item.price * (item.quantity || 1))}</b></button>)}</div>
      <div className="mt-5 border-t border-rose-100 pt-5"><div className="flex justify-between font-serif text-4xl font-bold"><span>Total</span><span>{eur(total)}</span></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => completeSale('cash')} className="rounded-2xl bg-stone-900 py-5 text-sm font-bold uppercase text-white">Cash</button><button onClick={() => completeSale('card')} className="rounded-2xl bg-[#da4d73] py-5 text-sm font-bold uppercase text-white">Tarjeta</button></div><button onClick={() => setCart([])} className="mt-2 w-full rounded-full border border-rose-100 py-3 text-xs font-bold uppercase">Vaciar</button></div>
      <div className="mt-6 rounded-xl border border-rose-100 p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">Consultar caja hoy</p>
        <div className="grid grid-cols-3 gap-2"><button onClick={() => viewRegister('cash')} className="rounded-lg bg-rose-50 py-2 text-xs font-bold">Cash</button><button onClick={() => viewRegister('card')} className="rounded-lg bg-rose-50 py-2 text-xs font-bold">Tarjeta</button><button onClick={() => viewRegister('all')} className="rounded-lg bg-rose-50 py-2 text-xs font-bold">Total</button></div>
        <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest text-stone-400">Cerrar caja</p>
        <div className="grid grid-cols-3 gap-2"><button onClick={() => closeRegister('cash')} className="rounded-lg bg-stone-100 py-2 text-xs font-bold">Cash</button><button onClick={() => closeRegister('card')} className="rounded-lg bg-stone-100 py-2 text-xs font-bold">Tarjeta</button><button onClick={() => closeRegister('all')} className="rounded-lg bg-stone-900 py-2 text-xs font-bold text-white">Total</button></div>
        <p className="mt-2 text-[10px] text-stone-400">{sales.length} cobros · {closures.length} cierres</p>
      </div>
      {closeout && <CloseoutTicket closeout={closeout} onClose={() => setCloseout(null)} />}
    </div>
  </div>;
}

function CloseoutTicket({ closeout, onClose }: { closeout: { mode: 'consulta' | 'cierre'; method: 'cash' | 'card' | 'all'; sales: PosSale[]; total: number; from?: string; to?: string }; onClose: () => void }) {
  return <div className="mt-5 rounded-[4px] bg-[#fffdf7] p-5 shadow-inner border border-stone-200 font-mono text-stone-900">
    <div className="text-center border-b border-dashed border-stone-300 pb-4">
      <p className="text-xs tracking-[0.3em]">PELUQUERIA MARIA</p>
      <h4 className="text-lg font-black">{closeout.mode === 'cierre' ? 'CIERRE DE CAJA' : 'CONSULTA DE CAJA'}</h4>
      <p className="text-xs">{new Date().toLocaleString('es-ES')}</p>
      <p className="mt-1 text-xs uppercase">Modo: {closeout.method}</p>
      {closeout.from && closeout.to && <p className="mt-1 text-[10px]">Desde {new Date(closeout.from).toLocaleString('es-ES')}<br />Hasta {new Date(closeout.to).toLocaleString('es-ES')}</p>}
    </div>
    <div className="my-4 max-h-64 space-y-2 overflow-auto">
      {closeout.sales.length === 0 ? <p className="text-center text-xs">Sin cobros</p> : closeout.sales.map(sale => <div key={sale.id} className="border-b border-dashed border-stone-200 pb-2 text-xs">
        <div className="flex justify-between"><span>{new Date(sale.created_at).toLocaleTimeString('es-ES')}</span><b>{eur(sale.total_cents / 100)}</b></div>
        <div className="flex justify-between text-stone-500"><span>{sale.client_name || 'Mostrador'}</span><span>{sale.payment_method.toUpperCase()}</span></div>
      </div>)}
    </div>
    <div className="border-t border-dashed border-stone-300 pt-4">
      <div className="flex justify-between text-xl font-black"><span>TOTAL</span><span>{eur(closeout.total)}</span></div>
      <button onClick={onClose} className="mt-4 w-full rounded-full bg-stone-900 py-2 text-xs font-bold uppercase text-white">Cerrar ticket</button>
    </div>
  </div>;
}

function AnalyticsView({ sales, saleItems, appointments }: { sales: PosSale[]; saleItems: PosSaleItem[]; appointments: Appointment[] }) {
  const byDay = sales.reduce<Record<string, number>>((acc, sale) => {
    const day = sale.created_at.slice(0, 10);
    acc[day] = (acc[day] || 0) + sale.total_cents / 100;
    return acc;
  }, {});
  const byItem = saleItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + item.total_cents / 100;
    return acc;
  }, {});
  const total = sales.reduce((sum, sale) => sum + sale.total_cents / 100, 0);
  const card = sales.filter(s => s.payment_method === 'card').reduce((sum, sale) => sum + sale.total_cents / 100, 0);
  const cash = sales.filter(s => s.payment_method === 'cash').reduce((sum, sale) => sum + sale.total_cents / 100, 0);
  return <div className="grid gap-6 xl:grid-cols-3"><Metric icon={<CreditCard className="w-5 h-5" />} label="Total POS" value={eur(total)} /><Metric icon={<ShoppingCart className="w-5 h-5" />} label="Tarjeta" value={eur(card)} /><Metric icon={<ShoppingCart className="w-5 h-5" />} label="Cash" value={eur(cash)} /><Panel title="Ingresos por dia"><Rows data={byDay} /></Panel><Panel title="Ingresos por servicio/producto"><Rows data={byItem} /></Panel><Panel title="Agenda"><p className="text-sm">Citas totales: <b>{appointments.length}</b></p><p className="text-sm">No-show: <b>{appointments.filter(a => a.status === 'NoShow').length}</b></p><p className="text-sm">Confirmadas: <b>{appointments.filter(a => a.status === 'Confirmed').length}</b></p></Panel></div>;
}

function Rows({ data }: { data: Record<string, number> }) {
  return <div className="space-y-2">{Object.entries(data).sort((a,b) => b[1] - a[1]).map(([label, value]) => <div key={label} className="flex justify-between rounded-xl bg-rose-50/40 p-3 text-sm"><span>{label}</span><b>{eur(value)}</b></div>)}</div>;
}

function StaffView({ staff, editingStaff, setEditingStaff, saveStaff, removeStaff }: { staff: AdminStaff[]; editingStaff: AdminStaff; setEditingStaff: React.Dispatch<React.SetStateAction<AdminStaff>>; saveStaff: () => Promise<void>; removeStaff: (id?: string) => Promise<void> }) {
  return <Panel title="Peluqueros y accesos"><div className="mb-5 grid gap-3 md:grid-cols-3"><Field label="Nombre" value={editingStaff.name} onChange={v => setEditingStaff(s => ({ ...s, name: v }))} /><Field label="Email acceso" value={editingStaff.email} onChange={v => setEditingStaff(s => ({ ...s, email: v }))} /><Field label="Password" type="password" value={editingStaff.password || ''} onChange={v => setEditingStaff(s => ({ ...s, password: v }))} /><Field label="Rol" value={editingStaff.role} onChange={v => setEditingStaff(s => ({ ...s, role: v }))} /><Field label="PIN tactil" value={editingStaff.pin || ''} onChange={v => setEditingStaff(s => ({ ...s, pin: v }))} /><label className="flex items-end gap-2 text-xs font-bold"><input type="checkbox" checked={editingStaff.is_admin === true} onChange={e => setEditingStaff(s => ({ ...s, is_admin: e.target.checked }))} /> Admin</label></div><button onClick={saveStaff} className="mb-5 rounded-full bg-[#da4d73] px-5 py-2 text-xs font-bold uppercase text-white">Guardar peluquero</button><div className="grid gap-3 md:grid-cols-2">{staff.map(s => <div key={s.id} className="rounded-xl border border-rose-100 p-4"><p className="font-bold">{s.name}</p><p className="text-xs text-stone-500">{s.email} · {s.role} {s.is_admin ? '· Admin' : ''}</p><div className="mt-3 flex gap-2"><button onClick={() => setEditingStaff(s)} className="rounded-lg border border-rose-100 px-3 py-1 text-xs font-bold">Editar</button><button onClick={() => removeStaff(s.id)} className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">Desactivar</button></div></div>)}</div></Panel>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm"><h3 className="mb-5 font-serif text-2xl font-bold">{title}</h3>{children}</section>;
}
