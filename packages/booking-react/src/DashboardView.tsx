/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
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
  TrendingUp,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { Appointment, createViteBookingClient } from '@booking-system/core';

const { invokeFunction } = createViteBookingClient();

type StaffStylist = { id: string; name: string; email?: string };

interface DashboardViewProps {
  appointments: Appointment[];
  stylists: StaffStylist[];
  currentUserEmail?: string;
  onToggleStatus: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  onChargeNoShow: (id: string) => Promise<void>;
  onUpdateAppointmentStatus: (id: string, status: Appointment['status'], updates?: Partial<Appointment>) => void;
  onOpenBooking: () => void;
  onAddAppointment: (appointment: Omit<Appointment, 'clientInitials' | 'avatarColor'>) => void;
  onLogout: () => Promise<void>;
}

type AdminTab = 'dashboard' | 'calendar' | 'clients' | 'catalog' | 'content' | 'settings' | 'pos' | 'analytics' | 'staff';
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
  is_featured?: boolean;
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
  opening_time?: string;
  closing_time?: string;
};
type AdminPost = { id?: string; title: string; category: string; read_time: string; summary: string; content_html: string; cover_image_url?: string; is_published?: boolean; published_date?: string };
type Subscriber = { id: string; email: string; created_at: string; source?: string };
type SavedClientProfile = { id?: string; name: string; email?: string; phone?: string; photo_url?: string; notes?: string; birthdate?: string; allergies?: string; preferences?: string; created_at?: string; updated_at?: string };
type NewsletterCampaign = { id: string; subject: string; template: string; body_html: string; status: 'draft' | 'sent' | 'failed'; recipient_count: number; sent_at?: string; error_message?: string; created_at: string };
type NewsletterDraft = { subject: string; template: string; body_html: string };
type Salon = { id: string; name: string; slug: string; address?: string; phone?: string; email?: string; brand_color?: string };

type AdminStaff = { id?: string; auth_user_id?: string; stylist_id?: string; name: string; email: string; password?: string; role: string; pin?: string; is_admin?: boolean; is_active?: boolean };
type PosSale = { id: string; appointment_id?: string; client_name?: string; client_email?: string; payment_method: 'cash' | 'card'; total_cents: number; created_at: string };
type PosSaleItem = { id: string; sale_id: string; item_type: 'service' | 'product'; name: string; quantity: number; unit_price_cents?: number; total_cents: number; created_at: string };
type CashClosure = { id: string; method: 'cash' | 'card' | 'all'; from_at: string; to_at: string; total_cents: number; sale_count: number; created_at: string };
type ClientProfile = SavedClientProfile & { key: string; appointments: Appointment[] };
type Notice = { id: number; title: string; message: string; type?: 'success' | 'error' | 'info' };

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

const buildClientProfiles = (appointments: Appointment[], savedClients: SavedClientProfile[] = []) => {
  const profiles = new Map<string, ClientProfile>();
  savedClients.forEach(client => {
    const key = normalizeText(client.email) || normalizePhone(client.phone) || normalizeText(client.name) || client.id || '';
    if (!key) return;
    profiles.set(key, { ...client, key, appointments: [] });
  });
  appointments.forEach(ap => {
    const key = clientIdentityKey(ap);
    if (!key) return;
    const existing = profiles.get(key);
    if (existing) {
      existing.appointments.push(ap);
      existing.name ||= ap.clientName;
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
const emptyPost: AdminPost = { title: '', category: 'Consejos', read_time: '3 min', summary: '', content_html: '', cover_image_url: '', is_published: true, published_date: isoDate(today()) };
const emptyClient: SavedClientProfile = { name: '', email: '', phone: '', photo_url: '', notes: '', birthdate: '', allergies: '', preferences: '' };
const newsletterTemplates: Record<string, NewsletterDraft> = {
  promo: {
    template: 'promo',
    subject: 'Oferta especial de belleza esta semana',
    body_html: '<h2>Oferta especial</h2><p>Esta semana tenemos una promocion pensada para mimarte. Reserva tu cita y disfruta de una experiencia completa en el salon.</p><p><strong>Plazas limitadas.</strong></p>'
  },
  tips: {
    template: 'tips',
    subject: 'Consejo beauty de la semana',
    body_html: '<h2>Consejo beauty</h2><p>Te compartimos una rutina sencilla para mantener tu piel y cabello cuidados entre visitas al salon.</p><p>Estamos encantadas de ayudarte a elegir el tratamiento ideal.</p>'
  },
  custom: {
    template: 'custom',
    subject: '',
    body_html: '<h2>Hola</h2><p>Escribe aqui tu email para el newsletter.</p>'
  }
};
const emptyAdminAppointment = { clientName: '', clientEmail: '', clientPhone: '', serviceId: '', stylistId: '', date: isoDate(today()), time: '10:00' };
const staffToStylists = (staff: AdminStaff[]): StaffStylist[] =>
  staff.filter(s => s.is_active !== false && s.stylist_id).map(s => ({ id: s.stylist_id as string, name: s.name, email: s.email }));
const normalizeColor = (value?: string) => /^#[0-9a-fA-F]{6}$/.test(value || '') ? value as string : '#da4d73';

export default function DashboardView({ appointments, stylists, currentUserEmail, onToggleStatus, onDeleteAppointment, onChargeNoShow, onUpdateAppointmentStatus, onOpenBooking, onAddAppointment, onLogout }: DashboardViewProps) {
  const now = today();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [staffScope, setStaffScope] = useState<'all' | 'mine'>('all');
  const [calendarDate, setCalendarDate] = useState(isoDate(now));
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
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [clients, setClients] = useState<SavedClientProfile[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [editingPost, setEditingPost] = useState<AdminPost>(emptyPost);
  const [editingClient, setEditingClient] = useState<SavedClientProfile>(emptyClient);
  const [clientSearch, setClientSearch] = useState('');
  const [newsletterDraft, setNewsletterDraft] = useState<NewsletterDraft>(newsletterTemplates.custom);
  const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AdminStaff>({ name: '', email: '', password: '', role: 'stylist', pin: '', is_admin: false, is_active: true });
  const [adminAppointment, setAdminAppointment] = useState(emptyAdminAppointment);
  const [posCart, setPosCart] = useState<{ id?: string; name: string; price: number; type: string; quantity?: number }[]>([]);
  const [posClient, setPosClient] = useState<{ appointmentId?: string; name: string; email?: string; phone?: string } | null>(null);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [cashCloseout, setCashCloseout] = useState<{ mode: 'consulta' | 'cierre'; method: 'cash' | 'card' | 'all'; sales: PosSale[]; total: number; from?: string; to?: string } | null>(null);
  const [staffStylists, setStaffStylists] = useState<StaffStylist[]>(stylists);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalonId, setSelectedSalonId] = useState('');
  const [newSalonName, setNewSalonName] = useState('');
  const [newSalonColor, setNewSalonColor] = useState('#da4d73');

  const notify = (message: string, type: Notice['type'] = 'success', title = type === 'error' ? 'Revisa esto' : 'Listo') => {
    const notice = { id: Date.now(), title, message, type };
    setNotices(prev => [notice, ...prev].slice(0, 3));
    window.setTimeout(() => setNotices(prev => prev.filter(item => item.id !== notice.id)), 4200);
  };

  useEffect(() => {
    invokeFunction<{
      products: any[];
      services: any[];
      staff?: any[];
      sales?: PosSale[];
      saleItems?: PosSaleItem[];
      closures?: CashClosure[];
      posts?: AdminPost[];
      subscribers?: Subscriber[];
      clients?: SavedClientProfile[];
      campaigns?: NewsletterCampaign[];
      salons?: Salon[];
      selectedSalonId?: string;
      settings?: any;
      policy?: any;
    }>('admin-panel', { action: 'load', salonId: selectedSalonId || undefined })
      .then(data => {
        setSalons(data.salons || []);
        if (!selectedSalonId && data.selectedSalonId) setSelectedSalonId(data.selectedSalonId);
        setProducts((data.products || []).filter(p => p.is_active !== false).map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand || '',
          description: p.description || '',
          price: Math.round((p.price_cents || 0) / 100),
          image_url: p.image_url || '',
          tag: p.tag || '',
          stock: p.stock || 0,
          is_featured: p.is_featured,
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
        const normalizedStaff = (data.staff || []).filter(s => s.is_active !== false).map(s => ({
          id: s.id,
          auth_user_id: s.auth_user_id,
          stylist_id: s.stylist_id,
          name: s.name,
          email: s.email,
          role: s.role,
          pin: s.pin || '',
          is_admin: s.is_admin,
          is_active: s.is_active
        }));
        setStaff(normalizedStaff);
        setStaffStylists(staffToStylists(normalizedStaff));
        setSales(data.sales || []);
        setSaleItems(data.saleItems || []);
        setClosures(data.closures || []);
        setPosts(data.posts || []);
        setSubscribers(data.subscribers || []);
        setClients(data.clients || []);
        setCampaigns(data.campaigns || []);
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
            opening_hours: data.settings.opening_hours || '',
            opening_time: data.settings.opening_time || '09:00',
            closing_time: data.settings.closing_time || '20:30'
          });
        }
      })
      .catch(error => console.warn('No se pudo cargar administracion:', error));
  }, [selectedSalonId]);

  useEffect(() => {
    if (stylists.length) setStaffStylists(stylists);
  }, [stylists]);

  const currentStaff = staff.find(s => s.email === currentUserEmail);
  const currentSalon = salons.find(salon => salon.id === selectedSalonId) || salons[0];
  const salonColor = normalizeColor(currentSalon?.brand_color);
  const professionals = staffStylists.length ? staffStylists : stylists;
  const currentStylist = currentStaff?.stylist_id ? professionals.find(s => s.id === currentStaff.stylist_id) : undefined;
  const appointmentsForSalon = selectedSalonId ? appointments.filter(ap => !ap.salonId || ap.salonId === selectedSalonId) : appointments;

  const filteredAppointments = useMemo(() => {
    const scoped = staffScope === 'mine' && currentStylist ? appointmentsForSalon.filter(ap => ap.stylistId === currentStylist.id) : appointmentsForSalon;
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
  }, [appointmentsForSalon, dateFilter, specificDate, rangeStart, rangeEnd, staffScope, currentStylist]);

  const analytics = useMemo(() => {
    const todayIso = isoDate(now);
    const todayAppointments = appointmentsForSalon.filter(ap => ap.date === todayIso);
    const weeklyRevenue = appointmentsForSalon
      .filter(ap => ap.date >= isoDate(addDays(now, -7)) && ap.status !== 'Cancelled')
      .reduce((sum, ap) => sum + ap.price, 0);
    const uniqueClients = new Set(appointmentsForSalon.map(clientIdentityKey)).size;
    const noShowRevenue = appointmentsForSalon
      .filter(ap => ap.paymentGuaranteeStatus === 'charged')
      .reduce((sum, ap) => sum + (ap.noShowFeeAmount || 0), 0);
    return { todayCount: todayAppointments.length, weeklyRevenue, uniqueClients, noShowRevenue };
  }, [appointmentsForSalon]);

  const clientProfiles = useMemo(() => buildClientProfiles(appointmentsForSalon, clients), [appointmentsForSalon, clients]);
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
    const { product } = await invokeFunction<{ product: any }>('admin-panel', { action: 'upsert_product', product: editingProduct, salonId: selectedSalonId });
    const normalized = { ...editingProduct, id: product.id };
    setProducts(prev => [normalized, ...prev.filter(p => p.id !== product.id)]);
    setEditingProduct(emptyProduct);
  };

  const createSalon = async () => {
    if (!newSalonName.trim()) return notify('Pon el nombre del salon.', 'error');
    const { salon } = await invokeFunction<{ salon: Salon }>('admin-panel', {
      action: 'create_salon',
      salon: { name: newSalonName.trim(), brand_color: newSalonColor }
    });
    setSalons(prev => [...prev, salon].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedSalonId(salon.id);
    setNewSalonName('');
    setNewSalonColor('#da4d73');
    notify('Salon creado.');
  };

  const updateSalon = async (updates: Partial<Salon>) => {
    if (!currentSalon) return notify('Selecciona un salon.', 'error');
    const nextSalon = { ...currentSalon, ...updates };
    if (!nextSalon.name.trim()) return notify('El salon necesita nombre.', 'error');
    const { salon } = await invokeFunction<{ salon: Salon }>('admin-panel', {
      action: 'update_salon',
      salon: nextSalon
    });
    setSalons(prev => prev.map(item => item.id === salon.id ? salon : item).sort((a, b) => a.name.localeCompare(b.name)));
  };

  const renameSalon = async () => {
    if (!currentSalon) return;
    const name = window.prompt('Nuevo nombre del salon', currentSalon.name);
    if (name === null) return;
    await updateSalon({ name: name.trim() });
    notify('Salon actualizado.');
  };

  const deleteSalon = async () => {
    if (!currentSalon) return;
    if (salons.length <= 1) return notify('No puedes eliminar el ultimo salon activo.', 'error');
    if (!window.confirm(`Eliminar el salon "${currentSalon.name}"? Sus datos quedaran ocultos en el panel.`)) return;
    const { selectedSalonId: nextSalonId } = await invokeFunction<{ selectedSalonId?: string }>('admin-panel', {
      action: 'delete_salon',
      salonId: currentSalon.id
    });
    setSalons(prev => prev.filter(salon => salon.id !== currentSalon.id));
    setSelectedSalonId(nextSalonId || salons.find(salon => salon.id !== currentSalon.id)?.id || '');
    notify('Salon eliminado.');
  };

  const savePost = async () => {
    const { post } = await invokeFunction<{ post: AdminPost }>('admin-panel', { action: 'upsert_post', post: editingPost, salonId: selectedSalonId });
    setPosts(prev => [post, ...prev.filter(p => p.id !== post.id)]);
    setEditingPost(emptyPost);
    notify('Post guardado.');
  };
  const removePost = async (id?: string) => {
    if (!id) return;
    await invokeFunction('admin-panel', { action: 'delete_post', id, salonId: selectedSalonId });
    setPosts(prev => prev.filter(p => p.id !== id));
  };
  const exportSubscribers = () => {
    const csv = ['Email,Fecha,Origen', ...subscribers.map(s => `${s.email},${new Date(s.created_at).toLocaleString('es-ES')},${s.source || ''}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter-suscriptores.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveClient = async () => {
    const payload = await invokeFunction<{ client: SavedClientProfile }>('admin-panel', { action: 'upsert_client', client: editingClient, salonId: selectedSalonId });
    setClients(prev => [payload.client, ...prev.filter(client => client.id !== payload.client.id)]);
    setEditingClient(emptyClient);
    notify('Ficha de cliente guardada.');
  };

  const removeClient = async (id?: string) => {
    if (!id) return;
    await invokeFunction('admin-panel', { action: 'delete_client', id, salonId: selectedSalonId });
    setClients(prev => prev.filter(client => client.id !== id));
    notify('Ficha de cliente eliminada.');
  };

  const sendNewsletter = async () => {
    setIsSendingNewsletter(true);
    try {
      const payload = await invokeFunction<{ campaign: NewsletterCampaign }>('admin-panel', {
        action: 'send_newsletter',
        salonId: selectedSalonId,
        subject: newsletterDraft.subject,
        template: newsletterDraft.template,
        body_html: newsletterDraft.body_html
      });
      setCampaigns(prev => [payload.campaign, ...prev]);
      notify(`Newsletter enviado a ${payload.campaign.recipient_count} emails.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo enviar el newsletter.', 'error');
    } finally {
      setIsSendingNewsletter(false);
    }
  };

  const saveService = async () => {
    const { service } = await invokeFunction<{ service: any }>('admin-panel', { action: 'upsert_service', service: editingService, salonId: selectedSalonId });
    const normalized = { ...editingService, id: service.id };
    setServices(prev => [normalized, ...prev.filter(s => s.id !== service.id)]);
    setEditingService(emptyService);
  };

  const removeProduct = async (id?: string) => {
    if (!id) return;
    await invokeFunction('admin-panel', { action: 'delete_product', id, salonId: selectedSalonId });
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const removeService = async (id?: string) => {
    if (!id) return;
    await invokeFunction('admin-panel', { action: 'delete_service', id, salonId: selectedSalonId });
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const savePolicy = async () => {
    await invokeFunction('admin-panel', { action: 'save_policy', policy, salonId: selectedSalonId });
    notify('Politica no-show guardada.');
  };

  const saveSettings = async () => {
    await invokeFunction('admin-panel', { action: 'save_settings', settings, salonId: selectedSalonId });
    notify('Ajustes de salon guardados.');
  };

  const saveStaff = async () => {
    const { staff: saved } = await invokeFunction<{ staff: any }>('admin-panel', { action: 'upsert_staff', staff: editingStaff, salonId: selectedSalonId });
    setStaff(prev => {
      const next = [{ ...editingStaff, id: saved.id, auth_user_id: saved.auth_user_id, stylist_id: saved.stylist_id, password: '' }, ...prev.filter(s => s.id !== saved.id)];
      setStaffStylists(staffToStylists(next));
      return next;
    });
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
    if (!adminAppointment.clientName.trim()) return notify('Pon al menos el nombre del cliente.', 'error');
    if (!adminAppointment.serviceId) return notify('Selecciona un servicio.', 'error');
    const selectedService = services.find(service => service.id === adminAppointment.serviceId);
    const selectedStylist = professionals.find(stylist => stylist.id === adminAppointment.stylistId);
    const { appointment } = await invokeFunction<{ appointment: any }>('admin-panel', {
      action: 'create_appointment',
      salonId: selectedSalonId,
      appointment: adminAppointment
    });
    onAddAppointment({
      id: appointment.id,
      salonId: appointment.salon_id || selectedSalonId,
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
    notify('Cita walk-in creada sin tarjeta.');
  };

  const removeStaff = async (id?: string) => {
    if (!id) return;
    await invokeFunction('admin-panel', { action: 'delete_staff', id, salonId: selectedSalonId });
    setStaff(prev => {
      const next = prev.filter(s => s.id !== id);
      setStaffStylists(staffToStylists(next));
      return next;
    });
  };

  const chargeNoShow = async (ap: Appointment) => {
    if (!ap.stripeCustomerId || !ap.stripePaymentMethodId) {
      notify('Esta reserva no tiene tarjeta guardada. Solo puedes cobrar no-show en reservas con garantia de pago.', 'error');
      return;
    }
    if (ap.paymentGuaranteeStatus === 'charged') {
      notify('Esta reserva ya tiene el no-show cobrado.', 'info');
      return;
    }
    if (!window.confirm(`Marcar a ${ap.clientName} como no-show y cobrar ${eur(ap.noShowFeeAmount || 0)}?`)) return;
    setProcessingNoShowId(ap.id);
    try {
      await onChargeNoShow(ap.id);
      notify('No-show cobrado segun la politica actual.', 'success', 'Cargo realizado');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo cobrar el no-show.', 'error');
    } finally {
      setProcessingNoShowId(null);
      setActiveMenuId(null);
    }
  };

  const updateAppointmentStatus = async (ap: Appointment, status: Appointment['status']) => {
    const { appointment } = await invokeFunction<{ appointment: any }>('admin-panel', {
      action: 'update_appointment_status',
      salonId: selectedSalonId,
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
    if (ap.status === 'NoShow') return notify('Esta cita ya esta marcada como no-show.', 'info');
    if (!window.confirm(`Marcar a ${ap.clientName} como no-show sin cargo de tarjeta?`)) return;
    await updateAppointmentStatus(ap, 'NoShow');
  };

  const posTotal = posCart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const todayAppointments = appointmentsForSalon.filter(ap => ap.date === isoDate(now) && (staffScope === 'all' || !currentStylist || ap.stylistId === currentStylist.id));

  const completePosSale = async (paymentMethod: 'cash' | 'card') => {
    if (!posCart.length) return notify('Anade productos o servicios al ticket.', 'error');
    const { sale } = await invokeFunction<{ sale: PosSale }>('admin-panel', {
      action: 'create_sale',
      salonId: selectedSalonId,
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
    notify(`Cobro registrado: ${eur(posTotal)} (${paymentMethod === 'cash' ? 'cash' : 'tarjeta'}).`);
  };

  const viewRegister = (method: 'cash' | 'card' | 'all') => {
    const day = isoDate(now);
    const filtered = (method === 'all' ? sales : sales.filter(s => s.payment_method === method)).filter(s => s.created_at.slice(0, 10) === day);
    const total = filtered.reduce((sum, sale) => sum + sale.total_cents / 100, 0);
    setCashCloseout({ mode: 'consulta', method, sales: filtered, total, from: `${day}T00:00:00`, to: new Date().toISOString() });
  };

  const closeRegister = async (method: 'cash' | 'card' | 'all') => {
    const { closure, sales: closedSales } = await invokeFunction<{ closure: CashClosure; sales: PosSale[] }>('admin-panel', { action: 'close_register', method, salonId: selectedSalonId });
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff1f4_0,#fffbfb_36%,#f8fafc_100%)] text-stone-900 md:pl-72" style={{ '--salon-color': salonColor } as React.CSSProperties}>
      <NoticeStack notices={notices} onDismiss={id => setNotices(prev => prev.filter(item => item.id !== id))} />
      <aside className="fixed left-0 top-0 hidden md:flex h-screen w-72 flex-col border-r border-rose-100/70 bg-white/85 p-5 shadow-[20px_0_60px_rgba(190,18,60,0.06)] backdrop-blur-2xl">
        <div className="mb-6 rounded-3xl border border-rose-100 bg-gradient-to-br from-white via-rose-50 to-pink-50 px-5 py-5 text-stone-900 shadow-xl shadow-rose-100/70">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--salon-color)]">Admin Portal</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-stone-950">{currentSalon?.name || 'Maria'}</h1>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">Reservas, caja, clientes y contenidos en un solo panel.</p>
        </div>
        <nav className="flex flex-col gap-2 text-xs font-bold">
          <NavButton active={activeTab === 'dashboard'} icon={<CalendarDays className="w-4 h-4" />} label="Agenda" onClick={() => setActiveTab('dashboard')} />
          <NavButton active={activeTab === 'calendar'} icon={<CalendarDays className="w-4 h-4" />} label="Calendario dia" onClick={() => setActiveTab('calendar')} />
          <NavButton active={activeTab === 'clients'} icon={<Users className="w-4 h-4" />} label="Fichas clientes" onClick={() => setActiveTab('clients')} />
          <NavButton active={activeTab === 'analytics'} icon={<LayoutGrid className="w-4 h-4" />} label="Analiticas" onClick={() => setActiveTab('analytics')} />
          <NavButton active={activeTab === 'catalog'} icon={<Package className="w-4 h-4" />} label="Productos y servicios" onClick={() => setActiveTab('catalog')} />
          <NavButton active={activeTab === 'content'} icon={<LayoutGrid className="w-4 h-4" />} label="Contenido" onClick={() => setActiveTab('content')} />
          <NavButton active={activeTab === 'staff'} icon={<Users className="w-4 h-4" />} label="Peluqueros" onClick={() => setActiveTab('staff')} />
          <NavButton active={activeTab === 'settings'} icon={<Settings className="w-4 h-4" />} label="Ajustes y no-show" onClick={() => setActiveTab('settings')} />
          <NavButton active={activeTab === 'pos'} icon={<ShoppingCart className="w-4 h-4" />} label="POS tactil" onClick={() => setActiveTab('pos')} />
        </nav>
        <button onClick={onOpenBooking} className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--salon-color)] px-4 py-3 text-xs font-bold uppercase text-white shadow-lg shadow-rose-200 transition-transform active:scale-95">
          <Plus className="w-4 h-4" /> Nueva reserva
        </button>
        <button onClick={onLogout} className="mt-3 inline-flex items-center justify-center rounded-2xl border border-rose-100 bg-white px-4 py-3 text-xs font-bold uppercase text-stone-600 hover:bg-rose-50">
          Logout
        </button>
      </aside>

      <main className="p-5 pt-8 md:p-10">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--salon-color)]">{now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <h2 className="font-serif text-3xl font-bold">Panel de control</h2>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <Select label="Salon activo" value={selectedSalonId} onChange={setSelectedSalonId}>
                {salons.map(salon => <option key={salon.id} value={salon.id}>{salon.name}</option>)}
              </Select>
              {currentSalon && (
                <>
                  <button onClick={renameSalon} className="rounded-xl border border-rose-100 bg-white px-4 py-2 text-xs font-bold uppercase text-stone-700 hover:bg-rose-50">Editar nombre</button>
                  <Field label="Color panel" type="color" value={salonColor} onChange={value => updateSalon({ brand_color: value })} />
                  <button onClick={deleteSalon} className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold uppercase text-rose-600 hover:bg-rose-50">Eliminar salon</button>
                </>
              )}
              <Field label="Nuevo salon" value={newSalonName} onChange={setNewSalonName} />
              <Field label="Color nuevo" type="color" value={newSalonColor} onChange={setNewSalonColor} />
              <button onClick={createSalon} className="rounded-xl bg-[var(--salon-color)] px-4 py-2 text-xs font-bold uppercase text-white">Crear salon</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <MobileTab active={activeTab === 'dashboard'} label="Agenda" onClick={() => setActiveTab('dashboard')} />
            <MobileTab active={activeTab === 'calendar'} label="Dia" onClick={() => setActiveTab('calendar')} />
            <MobileTab active={activeTab === 'catalog'} label="Catalogo" onClick={() => setActiveTab('catalog')} />
            <MobileTab active={activeTab === 'settings'} label="Ajustes" onClick={() => setActiveTab('settings')} />
            <MobileTab active={activeTab === 'pos'} label="POS" onClick={() => setActiveTab('pos')} />
            <MobileTab active={false} label="Logout" onClick={onLogout} />
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
                <button onClick={onOpenBooking} className="rounded-full bg-[var(--salon-color)] px-5 py-3 text-xs font-bold uppercase text-white">Nueva cita online</button>
              </div>
            </section>

            <section className="mb-5 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold">Crear walk-in / cita admin</h3>
                  <p className="text-xs text-stone-500">Sin tarjeta ni garantia de pago. Busca ficha por nombre, telefono o email.</p>
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
                  {professionals.map(stylist => <option key={stylist.id} value={stylist.id}>{stylist.name}</option>)}
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
                    const hasAppointment = appointmentsForSalon.some(ap => ap.date === date);
                    return (
                      <button key={date} onClick={() => { setSpecificDate(date); setDateFilter('specific'); }} className={`relative rounded-lg py-3 font-bold ${!isCurrentMonth ? 'text-stone-300' : isToday ? 'bg-[var(--salon-color)] text-white' : 'hover:bg-rose-50'}`}>
                        {day.getDate()}
                        {hasAppointment && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${isToday ? 'bg-white' : 'bg-[var(--salon-color)]'}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'calendar' && (
          <DailySchedulePage
            date={calendarDate}
            setDate={setCalendarDate}
            stylists={professionals}
            appointments={appointmentsForSalon}
            staffScope={staffScope}
            setStaffScope={setStaffScope}
            currentStylist={currentStylist}
          />
        )}

        {activeTab === 'clients' && <ClientsView clients={clientProfiles} editingClient={editingClient} setEditingClient={setEditingClient} saveClient={saveClient} removeClient={removeClient} clientSearch={clientSearch} setClientSearch={setClientSearch} />}
        {activeTab === 'analytics' && <AnalyticsView sales={sales} saleItems={saleItems} appointments={appointmentsForSalon} />}
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
        {activeTab === 'content' && <ContentView posts={posts} editingPost={editingPost} setEditingPost={setEditingPost} savePost={savePost} removePost={removePost} subscribers={subscribers} exportSubscribers={exportSubscribers} newsletterDraft={newsletterDraft} setNewsletterDraft={setNewsletterDraft} sendNewsletter={sendNewsletter} isSendingNewsletter={isSendingNewsletter} campaigns={campaigns} />}
        {activeTab === 'settings' && <SettingsView policy={policy} settings={settings} setPolicy={setPolicy} setSettings={setSettings} savePolicy={savePolicy} saveSettings={saveSettings} />}
        {activeTab === 'staff' && <StaffView staff={staff} editingStaff={editingStaff} setEditingStaff={setEditingStaff} saveStaff={saveStaff} removeStaff={removeStaff} />}
        {activeTab === 'pos' && <PosView services={services} products={products} cart={posCart} setCart={setPosCart} total={posTotal} appointmentsToday={todayAppointments} appointments={appointmentsForSalon} posClient={posClient} setPosClient={setPosClient} completeSale={completePosSale} closeRegister={closeRegister} viewRegister={viewRegister} sales={sales} saleItems={saleItems} manualItemName={manualItemName} manualItemPrice={manualItemPrice} setManualItemName={setManualItemName} setManualItemPrice={setManualItemPrice} closeout={cashCloseout} setCloseout={setCashCloseout} closures={closures} updateAppointmentStatus={updateAppointmentStatus} chargeNoShow={posNoShow} />}
      </main>
    </div>
  );
}

function DailySchedulePage({
  date,
  setDate,
  stylists,
  appointments,
  staffScope,
  setStaffScope,
  currentStylist
}: {
  date: string;
  setDate: (date: string) => void;
  stylists: StaffStylist[];
  appointments: Appointment[];
  staffScope: 'all' | 'mine';
  setStaffScope: (scope: 'all' | 'mine') => void;
  currentStylist?: StaffStylist;
}) {
  const visibleStylists = staffScope === 'mine' && currentStylist ? [currentStylist] : stylists;
  const rows = [{ id: '', name: 'Cualquiera' }, ...visibleStylists];
  const hours = Array.from({ length: 13 }, (_, index) => 8 + index);
  const dayAppointments = appointments.filter(ap => ap.date === date);
  return (
    <section className="min-h-[78vh]">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--salon-color)]">Calendario operativo</p>
          <h3 className="font-serif text-4xl font-bold">Agenda del dia</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-rose-100 bg-white p-3 shadow-sm">
          <Field label="Dia" type="date" value={date} onChange={setDate} />
          <Select label="Profesional" value={staffScope} onChange={value => setStaffScope(value as 'all' | 'mine')}>
            <option value="all">Todas</option>
            <option value="mine">Solo las mias</option>
          </Select>
        </div>
      </div>
      <div className="overflow-auto rounded-2xl border border-rose-100 bg-white shadow-sm">
        <div className="grid min-w-[920px]" style={{ gridTemplateColumns: `88px repeat(${rows.length}, minmax(210px, 1fr))` }}>
          <div className="sticky left-0 top-0 z-20 border-b border-r border-rose-100 bg-white p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Hora</div>
          {rows.map(row => (
            <div key={row.id || 'any-head'} className="sticky top-0 z-10 border-b border-r border-rose-100 bg-white p-4">
              <p className="font-serif text-xl font-bold">{row.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {dayAppointments.filter(ap => row.id ? ap.stylistId === row.id : !ap.stylistId).length} citas
              </p>
            </div>
          ))}
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="sticky left-0 z-10 min-h-28 border-b border-r border-rose-100 bg-white p-3 text-sm font-black text-stone-500">
                {String(hour).padStart(2, '0')}:00
              </div>
              {rows.map(row => {
                const slotAppointments = dayAppointments.filter(ap => {
                  const apHour = appointmentHour(ap.time);
                  return apHour === hour && (row.id ? ap.stylistId === row.id : !ap.stylistId);
                });
                return (
                  <div key={`${row.id || 'any'}-${hour}`} className="min-h-28 border-b border-r border-rose-100 bg-rose-50/10 p-2">
                    <div className="space-y-2">
                      {slotAppointments.map(ap => (
                        <div key={ap.id} className="rounded-xl border border-rose-100 bg-white p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <b className="text-sm">{ap.time}</b>
                            <Status appointment={ap} />
                          </div>
                          <p className="mt-2 font-bold">{ap.clientName}</p>
                          <p className="text-xs text-stone-500">{ap.service}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--salon-color)]">{eur(ap.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function appointmentHour(time: string) {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return Number(time.slice(0, 2)) || 0;
  let hour = Number(match[1]);
  const suffix = match[3]?.toUpperCase();
  if (suffix === 'PM' && hour !== 12) hour += 12;
  if (suffix === 'AM' && hour === 12) hour = 0;
  return hour;
}
function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${active ? 'bg-[var(--salon-color)] text-white shadow-lg shadow-rose-200' : 'text-stone-500 hover:bg-rose-50/80 hover:text-stone-900'}`}>{icon}<span>{label}</span></button>;
}

function MobileTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase ${active ? 'bg-[var(--salon-color)] text-white' : 'bg-white text-stone-500 border border-rose-100'}`}>{label}</button>;
}

function NoticeStack({ notices, onDismiss }: { notices: Notice[]; onDismiss: (id: number) => void }) {
  return <div className="fixed right-5 top-5 z-[80] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">
    {notices.map(notice => (
      <div key={notice.id} className={`rounded-2xl border bg-white/95 p-4 shadow-2xl backdrop-blur-xl ${notice.type === 'error' ? 'border-rose-200' : notice.type === 'info' ? 'border-stone-200' : 'border-emerald-100'}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notice.type === 'error' ? 'bg-rose-50 text-[#da4d73]' : notice.type === 'info' ? 'bg-stone-100 text-stone-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {notice.type === 'error' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-stone-900">{notice.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-600">{notice.message}</p>
          </div>
          <button onClick={() => onDismiss(notice.id)} className="rounded-lg p-1 text-stone-400 hover:bg-rose-50 hover:text-stone-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ))}
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[1.5rem] border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-100"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-[var(--salon-color)]">{icon}</div><p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p><p className="mt-1 font-serif text-3xl font-bold">{value}</p></div>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}<input type={type} value={value} onChange={e => onChange(e.target.value)} className="mt-1 block rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs text-stone-800 outline-[var(--salon-color)]" /></label>;
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}<select value={value} onChange={e => onChange(e.target.value)} className="mt-1 block rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs text-stone-800 outline-[var(--salon-color)]">{children}</select></label>;
}

function IconButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return <button title={title} onClick={onClick} className="rounded-lg border border-rose-100 p-1.5 text-stone-500 hover:bg-rose-50">{children}</button>;
}

function MenuAction({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`block w-full rounded-lg px-3 py-2 text-left text-[11px] font-bold ${danger ? 'text-rose-600 hover:bg-rose-50' : 'text-stone-700 hover:bg-rose-50'}`}>{children}</button>;
}

function Status({ appointment }: { appointment: Appointment }) {
  const label = appointment.status === 'NoShow' ? 'No-show' : appointment.status === 'Confirmed' ? 'Confirmada' : appointment.status === 'Cancelled' ? 'Cancelada' : 'Pendiente';
  return <div className="flex flex-col gap-1"><span className="w-fit rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-[var(--salon-color)]">{label}</span>{appointment.paymentGuaranteeStatus === 'charged' && <span className="w-fit rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-700">No-show cobrado</span>}{appointment.paymentGuaranteeStatus === 'secured' && <span className="w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Tarjeta guardada</span>}</div>;
}

function ClientsView({
  clients,
  editingClient,
  setEditingClient,
  saveClient,
  removeClient,
  clientSearch,
  setClientSearch
}: {
  clients: ClientProfile[];
  editingClient: SavedClientProfile;
  setEditingClient: React.Dispatch<React.SetStateAction<SavedClientProfile>>;
  saveClient: () => Promise<void>;
  removeClient: (id?: string) => Promise<void>;
  clientSearch: string;
  setClientSearch: (value: string) => void;
}) {
  const query = normalizeText(clientSearch);
  const visibleClients = clients.filter(client =>
    !query ||
    normalizeText(client.name).includes(query) ||
    normalizeText(client.email).includes(query) ||
    normalizePhone(client.phone).includes(normalizePhone(clientSearch))
  );

  return <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
    <Panel title="Editar ficha">
      <div className="space-y-3">
        <Field label="Nombre" value={editingClient.name} onChange={v => setEditingClient(c => ({ ...c, name: v }))} />
        <Field label="Email" type="email" value={editingClient.email || ''} onChange={v => setEditingClient(c => ({ ...c, email: v }))} />
        <Field label="Telefono" value={editingClient.phone || ''} onChange={v => setEditingClient(c => ({ ...c, phone: v }))} />
        <Field label="Foto URL" value={editingClient.photo_url || ''} onChange={v => setEditingClient(c => ({ ...c, photo_url: v }))} />
        <Field label="Cumpleanos" type="date" value={editingClient.birthdate || ''} onChange={v => setEditingClient(c => ({ ...c, birthdate: v }))} />
        <Field label="Alergias" value={editingClient.allergies || ''} onChange={v => setEditingClient(c => ({ ...c, allergies: v }))} />
        <Field label="Preferencias" value={editingClient.preferences || ''} onChange={v => setEditingClient(c => ({ ...c, preferences: v }))} />
        <textarea value={editingClient.notes || ''} onChange={e => setEditingClient(c => ({ ...c, notes: e.target.value }))} placeholder="Notas internas" className="h-28 w-full rounded-xl border border-rose-100 p-3 text-sm outline-[#da4d73]" />
        <div className="flex gap-2">
          <button onClick={saveClient} className="rounded-full bg-[#da4d73] px-5 py-2 text-xs font-bold uppercase text-white">Guardar ficha</button>
          <button onClick={() => setEditingClient(emptyClient)} className="rounded-full border border-rose-100 px-5 py-2 text-xs font-bold uppercase text-stone-600">Nueva</button>
        </div>
      </div>
    </Panel>
    <Panel title="Fichas de clientes">
      <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Buscar por nombre, email o telefono" className="mb-5 w-full rounded-2xl border border-rose-100 px-4 py-3 text-sm outline-[#da4d73]" />
      <div className="grid gap-3 md:grid-cols-2">
        {visibleClients.map(client => <div key={client.key} className="rounded-2xl border border-rose-100 p-4">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-2xl bg-rose-50">
              {client.photo_url ? <img src={client.photo_url} alt={client.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center font-serif text-xl font-bold text-[#da4d73]">{client.name.slice(0, 1).toUpperCase()}</div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{client.name}</p>
              <p className="text-xs text-stone-500">{client.email || 'Sin email'}{client.phone ? ` · ${client.phone}` : ''}</p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-stone-400">{client.appointments.length} citas encontradas</p>
            </div>
          </div>
          {(client.notes || client.preferences || client.allergies) && <p className="mt-3 rounded-xl bg-rose-50/50 p-3 text-xs text-stone-600">{client.notes || client.preferences || client.allergies}</p>}
          <div className="mt-3 max-h-28 space-y-1 overflow-auto">{client.appointments.slice(0, 5).map(ap => <div key={ap.id} className="rounded-lg bg-rose-50 px-2 py-1 text-[11px]">{ap.date} · {ap.service}</div>)}</div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setEditingClient({ ...client })} className="rounded-lg border border-rose-100 px-3 py-1 text-xs font-bold">Editar</button>
            {client.id && <button onClick={() => removeClient(client.id)} className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">Eliminar</button>}
          </div>
        </div>)}
      </div>
    </Panel>
  </div>;
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
        <label className="flex items-end gap-2 text-xs font-bold"><input type="checkbox" checked={props.editingProduct.is_featured === true} onChange={e => props.setEditingProduct(p => ({ ...p, is_featured: e.target.checked }))} /> Recomendado en home</label>
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

function ContentView({
  posts,
  editingPost,
  setEditingPost,
  savePost,
  removePost,
  subscribers,
  exportSubscribers,
  newsletterDraft,
  setNewsletterDraft,
  sendNewsletter,
  isSendingNewsletter,
  campaigns
}: {
  posts: AdminPost[];
  editingPost: AdminPost;
  setEditingPost: React.Dispatch<React.SetStateAction<AdminPost>>;
  savePost: () => Promise<void>;
  removePost: (id?: string) => Promise<void>;
  subscribers: Subscriber[];
  exportSubscribers: () => void;
  newsletterDraft: NewsletterDraft;
  setNewsletterDraft: React.Dispatch<React.SetStateAction<NewsletterDraft>>;
  sendNewsletter: () => Promise<void>;
  isSendingNewsletter: boolean;
  campaigns: NewsletterCampaign[];
}) {
  const applyFormat = (tag: 'strong' | 'em' | 'p') => {
    const text = window.getSelection()?.toString();
    if (!text) return;
    setEditingPost(p => ({ ...p, content_html: `${p.content_html}<${tag}>${text}</${tag}>` }));
  };
  return <div className="grid gap-6 xl:grid-cols-2">
    <Panel title="Posts consejos belleza">
      <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50/20 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Titulo" value={editingPost.title} onChange={v => setEditingPost(p => ({ ...p, title: v }))} />
          <Field label="Categoria" value={editingPost.category} onChange={v => setEditingPost(p => ({ ...p, category: v }))} />
          <Field label="Tiempo lectura" value={editingPost.read_time} onChange={v => setEditingPost(p => ({ ...p, read_time: v }))} />
          <Field label="Portada imagen URL" value={editingPost.cover_image_url || ''} onChange={v => setEditingPost(p => ({ ...p, cover_image_url: v }))} />
        </div>
        <textarea value={editingPost.summary} onChange={e => setEditingPost(p => ({ ...p, summary: e.target.value }))} placeholder="Resumen" className="mt-3 h-20 w-full rounded-xl border border-rose-100 p-3 text-sm outline-[#da4d73]" />
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => applyFormat('strong')} className="rounded-lg bg-white px-3 py-2 text-xs font-bold">B</button>
          <button type="button" onClick={() => applyFormat('em')} className="rounded-lg bg-white px-3 py-2 text-xs font-bold">I</button>
          <button type="button" onClick={() => setEditingPost(p => ({ ...p, content_html: `${p.content_html}<p></p>` }))} className="rounded-lg bg-white px-3 py-2 text-xs font-bold">Parrafo</button>
        </div>
        <div contentEditable suppressContentEditableWarning onInput={e => setEditingPost(p => ({ ...p, content_html: e.currentTarget.innerHTML }))} className="mt-3 min-h-40 rounded-xl border border-rose-100 bg-white p-3 text-sm outline-[#da4d73]" dangerouslySetInnerHTML={{ __html: editingPost.content_html }} />
        <label className="mt-3 flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={editingPost.is_published !== false} onChange={e => setEditingPost(p => ({ ...p, is_published: e.target.checked }))} /> Publicado</label>
        <button onClick={savePost} className="mt-4 rounded-full bg-[#da4d73] px-5 py-2 text-xs font-bold uppercase text-white">Guardar post</button>
      </div>
      <div className="space-y-2">{posts.map(post => <div key={post.id} className="rounded-xl border border-rose-100 p-3"><p className="font-bold">{post.title}</p><p className="text-xs text-stone-500">{post.category} · {post.read_time}</p><div className="mt-2 flex gap-2"><button onClick={() => setEditingPost(post)} className="rounded-lg border border-rose-100 px-3 py-1 text-xs font-bold">Editar</button><button onClick={() => removePost(post.id)} className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">Eliminar</button></div></div>)}</div>
    </Panel>
    <Panel title="Newsletter">
      <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50/20 p-4">
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <Select label="Plantilla" value={newsletterDraft.template} onChange={value => setNewsletterDraft(newsletterTemplates[value] || newsletterTemplates.custom)}>
            <option value="custom">Email personalizado</option>
            <option value="promo">Promocion</option>
            <option value="tips">Consejo beauty</option>
          </Select>
          <Field label="Asunto" value={newsletterDraft.subject} onChange={v => setNewsletterDraft(d => ({ ...d, subject: v }))} />
        </div>
        <textarea value={newsletterDraft.body_html} onChange={e => setNewsletterDraft(d => ({ ...d, body_html: e.target.value, template: d.template || 'custom' }))} className="h-44 w-full rounded-xl border border-rose-100 p-3 text-sm outline-[#da4d73]" />
        <div className="mt-3 rounded-xl bg-white p-3 text-sm" dangerouslySetInnerHTML={{ __html: newsletterDraft.body_html }} />
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={sendNewsletter} disabled={isSendingNewsletter} className="rounded-full bg-[#da4d73] px-5 py-2 text-xs font-bold uppercase text-white disabled:opacity-50">{isSendingNewsletter ? 'Enviando...' : `Enviar a ${subscribers.length} emails`}</button>
          <button onClick={exportSubscribers} className="rounded-full bg-stone-900 px-5 py-2 text-xs font-bold uppercase text-white">Exportar Excel</button>
        </div>
        <p className="mt-3 text-xs text-stone-500">Para enviar emails reales configura `RESEND_API_KEY` y opcionalmente `NEWSLETTER_FROM_EMAIL` en Supabase Edge Functions.</p>
      </div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">Campanas recientes</h4>
      <div className="mb-5 max-h-40 space-y-2 overflow-auto">{campaigns.map(c => <div key={c.id} className="rounded-xl border border-rose-100 p-3"><p className="font-bold">{c.subject}</p><p className="text-xs text-stone-500">{c.status} · {c.recipient_count} destinatarios · {new Date(c.created_at).toLocaleString('es-ES')}</p>{c.error_message && <p className="mt-1 text-xs text-rose-600">{c.error_message}</p>}</div>)}</div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">Emails registrados</h4>
      <div className="max-h-[320px] space-y-2 overflow-auto">{subscribers.map(s => <div key={s.id} className="rounded-xl border border-rose-100 p-3"><p className="font-bold">{s.email}</p><p className="text-xs text-stone-500">{new Date(s.created_at).toLocaleString('es-ES')}</p></div>)}</div>
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
  const isFixedPolicy = policy.charge_type === 'fixed';
  const policyPreview = isFixedPolicy
    ? `Stripe cobrara ${eur(Number(policy.fixed || 0))} al marcar y cobrar un no-show.`
    : `Stripe cobrara el ${Number(policy.percentage || 0)}% del precio de la cita al marcar y cobrar un no-show.`;

  return <div className="grid gap-6 xl:grid-cols-2">
    <Panel title="Politicas cancelacion y no-show">
      <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
        <label className="flex items-start gap-3 text-sm font-bold text-stone-800">
          <input
            type="checkbox"
            checked={policy.enabled}
            onChange={e => setPolicy(p => ({ ...p, enabled: e.target.checked }))}
            className="mt-1"
          />
          Activar cobro automatico de penalizacion al cobrar no-show con Stripe
        </label>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          Al pulsar cobrar no-show en una cita, Stripe usara siempre la politica guardada en este panel.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Select
          label="Tipo de penalizacion"
          value={policy.charge_type}
          onChange={v => setPolicy(p => ({ ...p, charge_type: v as NoShowPolicy['charge_type'] }))}
        >
          <option value="fixed">Monto fijo</option>
          <option value="percentage">Porcentaje de la cita</option>
        </Select>
        <Field label="Horas minimas para cancelar" type="number" value={policy.cancellation_hours} onChange={v => setPolicy(p => ({ ...p, cancellation_hours: Number(v) }))} />
        {isFixedPolicy ? (
          <Field label="Monto fijo EUR" type="number" value={policy.fixed} onChange={v => setPolicy(p => ({ ...p, fixed: Number(v) }))} />
        ) : (
          <Field label="Porcentaje %" type="number" value={policy.percentage} onChange={v => setPolicy(p => ({ ...p, percentage: Number(v) }))} />
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        {policy.enabled ? policyPreview : 'La politica esta desactivada: no se cobrara ninguna penalizacion no-show.'}
      </div>

      <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-stone-500">Texto de politica visible para clientes</label>
      <textarea value={policy.policy_text} onChange={e => setPolicy(p => ({ ...p, policy_text: e.target.value }))} className="mt-2 h-28 w-full rounded-xl border border-rose-100 p-3 text-sm outline-[#da4d73]" />
      <button onClick={savePolicy} className="mt-3 rounded-full bg-[#da4d73] px-5 py-2 text-xs font-bold uppercase text-white">Guardar politica</button>
    </Panel>
    <Panel title="Ajustes de salon">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre" value={settings.salon_name} onChange={v => setSettings(s => ({ ...s, salon_name: v }))} />
        <Field label="Telefono" value={settings.phone} onChange={v => setSettings(s => ({ ...s, phone: v }))} />
        <Field label="Email" value={settings.email} onChange={v => setSettings(s => ({ ...s, email: v }))} />
        <Field label="Direccion" value={settings.address} onChange={v => setSettings(s => ({ ...s, address: v }))} />
        <Field label="Apertura" type="time" value={settings.opening_time || '09:00'} onChange={v => setSettings(s => ({ ...s, opening_time: v }))} />
        <Field label="Cierre" type="time" value={settings.closing_time || '20:30'} onChange={v => setSettings(s => ({ ...s, closing_time: v }))} />
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
  const [posTab, setPosTab] = useState<'services' | 'products' | 'functions'>('services');
  const [manualKeyboardTarget, setManualKeyboardTarget] = useState<'name' | 'price' | null>(null);
  const serviceItems = services.map(s => ({ id: s.id, name: s.name, price: s.price, type: 'Servicio' }));
  const productItems = products.map(p => ({ id: p.id, name: p.name, price: p.price, type: 'Producto' }));
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
  const activeManualValue = manualKeyboardTarget === 'price' ? manualItemPrice : manualItemName;
  const setActiveManualValue = (value: string) => {
    if (manualKeyboardTarget === 'price') setManualItemPrice(value);
    if (manualKeyboardTarget === 'name') setManualItemName(value);
  };
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
      <div className="mb-5 grid grid-cols-3 gap-3">
        <PosTabButton active={posTab === 'services'} icon={<Scissors className="h-5 w-5" />} label="Servicios" onClick={() => setPosTab('services')} />
        <PosTabButton active={posTab === 'products'} icon={<Package className="h-5 w-5" />} label="Productos" onClick={() => setPosTab('products')} />
        <PosTabButton active={posTab === 'functions'} icon={<Settings className="h-5 w-5" />} label="Funciones" onClick={() => setPosTab('functions')} />
      </div>
      {posTab === 'services' && <PosItemGrid items={serviceItems} setCart={setCart} />}
      {posTab === 'products' && <PosItemGrid items={productItems} setCart={setCart} />}
      {posTab === 'functions' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-500">Entrada manual</p>
            <div className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
              <button onClick={() => setManualKeyboardTarget('name')} className={`rounded-xl border px-3 py-4 text-left text-sm font-bold ${manualKeyboardTarget === 'name' ? 'border-[#da4d73] bg-white text-stone-900 shadow-sm' : 'border-rose-100 bg-white text-stone-500'}`}>
                {manualItemName || 'Nombre concepto'}
              </button>
              <button onClick={() => setManualKeyboardTarget('price')} className={`rounded-xl border px-3 py-4 text-left text-sm font-bold ${manualKeyboardTarget === 'price' ? 'border-[#da4d73] bg-white text-stone-900 shadow-sm' : 'border-rose-100 bg-white text-stone-500'}`}>
                {manualItemPrice ? `${manualItemPrice} EUR` : 'Precio'}
              </button>
              <button onClick={addManualItem} className="rounded-xl bg-stone-900 px-5 py-4 text-xs font-bold uppercase text-white active:scale-95">Anadir</button>
            </div>
            {manualKeyboardTarget && (
              <TouchKeyboard
                mode={manualKeyboardTarget}
                value={activeManualValue}
                onChange={setActiveManualValue}
                onDone={() => setManualKeyboardTarget(null)}
                onSwitch={setManualKeyboardTarget}
              />
            )}
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-500">Consultar caja hoy</p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => viewRegister('cash')} className="min-h-20 rounded-2xl bg-rose-50 py-3 text-sm font-black uppercase active:scale-95">Cash</button>
              <button onClick={() => viewRegister('card')} className="min-h-20 rounded-2xl bg-rose-50 py-3 text-sm font-black uppercase active:scale-95">Tarjeta</button>
              <button onClick={() => viewRegister('all')} className="min-h-20 rounded-2xl bg-rose-50 py-3 text-sm font-black uppercase active:scale-95">Total</button>
            </div>
            <p className="mb-3 mt-5 text-xs font-bold uppercase tracking-widest text-stone-500">Cerrar caja</p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => closeRegister('cash')} className="min-h-20 rounded-2xl bg-stone-100 py-3 text-sm font-black uppercase active:scale-95">Cash</button>
              <button onClick={() => closeRegister('card')} className="min-h-20 rounded-2xl bg-stone-100 py-3 text-sm font-black uppercase active:scale-95">Tarjeta</button>
              <button onClick={() => closeRegister('all')} className="min-h-20 rounded-2xl bg-stone-900 py-3 text-sm font-black uppercase text-white active:scale-95">Total</button>
            </div>
            <p className="mt-3 text-[10px] text-stone-400">{sales.length} cobros · {closures.length} cierres</p>
          </div>
          {closeout && <CloseoutTicket closeout={closeout} onClose={() => setCloseout(null)} />}
        </div>
      )}
    </div>
    <div className="xl:col-span-4 rounded-2xl border border-rose-100 bg-white p-5">
      <h3 className="font-serif text-3xl font-bold">Ticket</h3>
      <p className="mb-4 text-xs font-bold text-[#da4d73]">{posClient ? posClient.name : 'Venta mostrador'}</p>
      <div className="space-y-2">{cart.map((item, index) => <button key={`${item.name}-${index}`} onClick={() => removeCartItem(index)} className="flex w-full items-center justify-between rounded-xl bg-rose-50/40 p-3 text-left text-sm active:scale-[0.99]"><span><b>{item.name}</b><span className="block text-[10px] font-bold uppercase tracking-widest text-stone-400">Tocar para eliminar</span></span><b>{eur(item.price * (item.quantity || 1))}</b></button>)}</div>
      <div className="mt-5 border-t border-rose-100 pt-5"><div className="flex justify-between font-serif text-4xl font-bold"><span>Total</span><span>{eur(total)}</span></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => completeSale('cash')} className="rounded-2xl bg-stone-900 py-5 text-sm font-bold uppercase text-white">Cash</button><button onClick={() => completeSale('card')} className="rounded-2xl bg-[#da4d73] py-5 text-sm font-bold uppercase text-white">Tarjeta</button></div><button onClick={() => setCart([])} className="mt-2 w-full rounded-full border border-rose-100 py-3 text-xs font-bold uppercase">Vaciar</button></div>
    </div>
  </div>;
}

function PosTabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-black uppercase active:scale-95 ${active ? 'border-[#da4d73] bg-[#da4d73] text-white shadow-lg shadow-rose-100' : 'border-rose-100 bg-rose-50/40 text-stone-700'}`}>{icon}<span>{label}</span></button>;
}

function PosItemGrid({ items, setCart }: { items: { id?: string; name: string; price: number; type: string }[]; setCart: React.Dispatch<React.SetStateAction<{ id?: string; name: string; price: number; type: string; quantity?: number }[]>> }) {
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
    {items.map(item => (
      <button key={`${item.type}-${item.id || item.name}`} onClick={() => setCart(prev => [...prev, { ...item, quantity: 1 }])} className="min-h-36 rounded-2xl border border-rose-100 bg-rose-50/30 p-4 text-left text-lg font-bold active:scale-95">
        <LayoutGrid className="mb-3 h-6 w-6 text-[#da4d73]" />
        {item.name}
        <span className="mt-3 block text-xl text-[#da4d73]">{eur(item.price)}</span>
        <span className="text-[10px] uppercase tracking-widest text-stone-400">{item.type}</span>
      </button>
    ))}
  </div>;
}

function TouchKeyboard({
  mode,
  value,
  onChange,
  onDone,
  onSwitch
}: {
  mode: 'name' | 'price';
  value: string;
  onChange: (value: string) => void;
  onDone: () => void;
  onSwitch: (mode: 'name' | 'price') => void;
}) {
  const add = (key: string) => {
    if (mode === 'price') {
      if (key === ',' || key === '.') {
        if (value.includes('.') || value.includes(',')) return;
        onChange(value ? `${value}.` : '0.');
        return;
      }
      onChange(`${value}${key}`.replace(',', '.'));
      return;
    }
    onChange(`${value}${key}`);
  };
  const remove = () => onChange(value.slice(0, -1));
  const clear = () => onChange('');
  const rows = mode === 'price'
    ? [['7','8','9'], ['4','5','6'], ['1','2','3'], ['0','.']]
    : [['Q','W','E','R','T','Y','U','I','O','P'], ['A','S','D','F','G','H','J','K','L'], ['Z','X','C','V','B','N','M']];

  return <div className="mt-4 rounded-2xl border border-rose-100 bg-white p-3 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onSwitch('name')} className={`rounded-xl px-4 py-3 text-xs font-black uppercase ${mode === 'name' ? 'bg-[#da4d73] text-white' : 'bg-rose-50 text-stone-600'}`}>Concepto</button>
        <button onClick={() => onSwitch('price')} className={`rounded-xl px-4 py-3 text-xs font-black uppercase ${mode === 'price' ? 'bg-[#da4d73] text-white' : 'bg-rose-50 text-stone-600'}`}>Precio</button>
      </div>
      <button onClick={onDone} className="rounded-xl bg-stone-900 px-5 py-3 text-xs font-black uppercase text-white">Listo</button>
    </div>
    <div className="mb-3 min-h-12 rounded-xl bg-rose-50/50 px-4 py-3 text-lg font-bold text-stone-900">
      {value || (mode === 'price' ? '0.00' : 'Nombre del concepto')}
    </div>
    <div className="grid gap-2">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
          {row.map(keyValue => <React.Fragment key={keyValue}><KeyboardKey label={keyValue} onClick={() => add(keyValue)} /></React.Fragment>)}
        </div>
      ))}
    </div>
    <div className="mt-2 grid grid-cols-3 gap-2">
      {mode === 'name' && <KeyboardKey label="Espacio" wide onClick={() => add(' ')} />}
      <KeyboardKey label="Borrar" onClick={remove} />
      <KeyboardKey label="Limpiar" onClick={clear} />
    </div>
  </div>;
}

function KeyboardKey({ label, onClick, wide = false }: { label: string; onClick: () => void; wide?: boolean }) {
  return <button onClick={onClick} className={`${wide ? 'col-span-1' : ''} min-h-14 rounded-xl border border-rose-100 bg-rose-50/60 text-sm font-black uppercase text-stone-800 active:scale-95`}>{label}</button>;
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
  const salesByDay = sales.reduce<Record<string, PosSale[]>>((acc, sale) => {
    const day = sale.created_at.slice(0, 10);
    acc[day] = [...(acc[day] || []), sale];
    return acc;
  }, {});
  const byItem = saleItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + item.total_cents / 100;
    return acc;
  }, {});
  const total = sales.reduce((sum, sale) => sum + sale.total_cents / 100, 0);
  const card = sales.filter(s => s.payment_method === 'card').reduce((sum, sale) => sum + sale.total_cents / 100, 0);
  const cash = sales.filter(s => s.payment_method === 'cash').reduce((sum, sale) => sum + sale.total_cents / 100, 0);
  const ticketAverage = sales.length ? total / sales.length : 0;
  const noShows = appointments.filter(a => a.status === 'NoShow').length;
  const confirmed = appointments.filter(a => a.status === 'Confirmed').length;

  return <div className="space-y-6">
    <section className="rounded-[2rem] border border-rose-100 bg-gradient-to-br from-white via-rose-50/80 to-pink-50 p-6 text-stone-900 shadow-xl shadow-rose-100/70">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#da4d73]">Analiticas</p>
          <h3 className="mt-2 font-serif text-4xl font-bold text-stone-950">Rendimiento del salon</h3>
          <p className="mt-2 text-sm text-stone-500">Ingresos, metodos de pago, agenda y tickets con detalle operativo.</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-right shadow-sm backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Ticket medio</p>
          <p className="font-serif text-3xl font-bold text-[#da4d73]">{eur(ticketAverage)}</p>
        </div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <InsightMetric icon={<CreditCard className="h-5 w-5" />} label="Total POS" value={eur(total)} sub={`${sales.length} transacciones`} tone="rose" />
      <InsightMetric icon={<BarChart3 className="h-5 w-5" />} label="Tarjeta" value={eur(card)} sub={`${Math.round((card / Math.max(total, 1)) * 100)}% del total`} tone="emerald" />
      <InsightMetric icon={<ShoppingCart className="h-5 w-5" />} label="Cash" value={eur(cash)} sub={`${Math.round((cash / Math.max(total, 1)) * 100)}% del total`} tone="amber" />
      <InsightMetric icon={<Activity className="h-5 w-5" />} label="Agenda" value={`${confirmed}/${appointments.length}`} sub={`${noShows} no-show`} tone="stone" />
    </section>

    <section className="grid gap-6 xl:grid-cols-12">
      <div className="xl:col-span-8"><RevenueChartPanel salesByDay={salesByDay} /></div>
      <div className="xl:col-span-4"><PaymentMixPanel card={card} cash={cash} total={total} /></div>
      <div className="xl:col-span-8"><DailyRevenuePanel salesByDay={salesByDay} saleItems={saleItems} /></div>
      <div className="xl:col-span-4"><Panel title="Top servicios/productos"><RankingRows data={byItem} /></Panel></div>
    </section>
  </div>;
}

function Rows({ data }: { data: Record<string, number> }) {
  return <div className="space-y-2">{Object.entries(data).sort((a,b) => b[1] - a[1]).map(([label, value]) => <div key={label} className="flex justify-between rounded-xl bg-rose-50/40 p-3 text-sm"><span>{label}</span><b>{eur(value)}</b></div>)}</div>;
}

function InsightMetric({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub: string; tone: 'rose' | 'emerald' | 'amber' | 'stone' }) {
  const toneClass = {
    rose: 'from-rose-50 to-white text-[#da4d73]',
    emerald: 'from-emerald-50 to-white text-emerald-700',
    amber: 'from-amber-50 to-white text-amber-700',
    stone: 'from-stone-100 to-white text-stone-800'
  }[tone];
  return <div className="group overflow-hidden rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-100">
    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${toneClass}`}>
      {icon}
    </div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
    <p className="mt-1 font-serif text-3xl font-bold text-stone-950">{value}</p>
    <p className="mt-2 flex items-center gap-1 text-xs font-bold text-stone-500"><TrendingUp className="h-3.5 w-3.5 text-emerald-600" />{sub}</p>
  </div>;
}

function RevenueChartPanel({ salesByDay }: { salesByDay: Record<string, PosSale[]> }) {
  const rows = Object.entries(salesByDay)
    .map(([day, daySales]) => ({ day, total: daySales.reduce((sum, sale) => sum + sale.total_cents / 100, 0), count: daySales.length }))
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-10);
  const max = Math.max(1, ...rows.map(row => row.total));

  return <Panel title="Ingresos ultimos dias">
    <div className="flex h-80 items-end gap-3 rounded-[1.5rem] bg-gradient-to-b from-rose-50/70 to-white p-4">
      {rows.length === 0 && <p className="self-center text-sm text-stone-500">Todavia no hay datos suficientes.</p>}
      {rows.map(row => {
        const height = Math.max(8, Math.round((row.total / max) * 100));
        return <div key={row.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-56 w-full items-end">
            <div
              className="w-full rounded-t-2xl bg-gradient-to-t from-[#da4d73] to-rose-300 shadow-lg shadow-rose-200 transition-all duration-700 ease-out"
              style={{ height: `${height}%` }}
              title={`${row.day}: ${eur(row.total)}`}
            />
          </div>
          <p className="text-[10px] font-black text-stone-800">{eur(row.total)}</p>
          <p className="text-[10px] font-bold uppercase text-stone-400">{new Date(`${row.day}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
          <p className="text-[10px] text-stone-400">{row.count} cobros</p>
        </div>;
      })}
    </div>
  </Panel>;
}

function PaymentMixPanel({ card, cash, total }: { card: number; cash: number; total: number }) {
  const cardPct = Math.round((card / Math.max(total, 1)) * 100);
  const cashPct = Math.round((cash / Math.max(total, 1)) * 100);
  return <Panel title="Mix de pago">
    <div className="space-y-5">
      <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-[conic-gradient(#10b981_0deg,#10b981_var(--card),#f59e0b_var(--card),#f59e0b_360deg)] shadow-inner" style={{ '--card': `${cardPct * 3.6}deg` } as React.CSSProperties}>
        <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-lg">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Total</p>
          <p className="font-serif text-2xl font-bold">{eur(total)}</p>
        </div>
      </div>
      <div className="space-y-3">
        <MixRow label="Tarjeta" value={eur(card)} pct={cardPct} className="bg-emerald-500" />
        <MixRow label="Cash" value={eur(cash)} pct={cashPct} className="bg-amber-500" />
      </div>
    </div>
  </Panel>;
}

function MixRow({ label, value, pct, className }: { label: string; value: string; pct: number; className: string }) {
  return <div>
    <div className="mb-1 flex justify-between text-xs"><b>{label}</b><span>{value} · {pct}%</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-stone-100"><div className={`h-full rounded-full transition-all duration-700 ${className}`} style={{ width: `${pct}%` }} /></div>
  </div>;
}

function RankingRows({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(1, ...rows.map(([, value]) => value));
  return <div className="space-y-3">
    {rows.length === 0 && <p className="rounded-xl bg-rose-50/40 p-4 text-sm text-stone-500">Sin ventas registradas.</p>}
    {rows.map(([label, value], index) => (
      <div key={label} className="rounded-2xl bg-stone-50 p-3">
        <div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-bold">{index + 1}. {label}</span><b>{eur(value)}</b></div>
        <div className="h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#da4d73] transition-all duration-700" style={{ width: `${Math.max(8, (value / max) * 100)}%` }} /></div>
      </div>
    ))}
  </div>;
}

function DailyRevenuePanel({ salesByDay, saleItems }: { salesByDay: Record<string, PosSale[]>; saleItems: PosSaleItem[] }) {
  const itemMap = saleItems.reduce<Record<string, PosSaleItem[]>>((acc, item) => {
    acc[item.sale_id] = [...(acc[item.sale_id] || []), item];
    return acc;
  }, {});
  const days = Object.entries(salesByDay).sort(([a], [b]) => b.localeCompare(a));

  return <Panel title="Ingresos por dia">
    <div className="space-y-4">
      {days.length === 0 && <p className="rounded-xl bg-rose-50/40 p-4 text-sm text-stone-500">Todavia no hay transacciones registradas.</p>}
      {days.map(([day, daySales]) => {
        const dayTotal = daySales.reduce((sum, sale) => sum + sale.total_cents / 100, 0);
        const dayCard = daySales.filter(sale => sale.payment_method === 'card').reduce((sum, sale) => sum + sale.total_cents / 100, 0);
        const dayCash = daySales.filter(sale => sale.payment_method === 'cash').reduce((sum, sale) => sum + sale.total_cents / 100, 0);
        return (
          <details key={day} className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm" open={day === days[0]?.[0]}>
            <summary className="cursor-pointer list-none bg-rose-50/50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{new Date(`${day}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-serif text-2xl font-bold text-stone-900">{eur(dayTotal)}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-white px-3 py-2"><p className="font-black">{daySales.length}</p><span className="text-stone-400">cobros</span></div>
                  <div className="rounded-xl bg-white px-3 py-2"><p className="font-black">{eur(dayCard)}</p><span className="text-stone-400">tarjeta</span></div>
                  <div className="rounded-xl bg-white px-3 py-2"><p className="font-black">{eur(dayCash)}</p><span className="text-stone-400">cash</span></div>
                </div>
              </div>
            </summary>
            <div className="divide-y divide-rose-50">
              {daySales.map(sale => {
                const items = itemMap[sale.id] || [];
                return (
                  <div key={sale.id} className="p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-bold text-stone-900">{sale.client_name || 'Venta mostrador'}</p>
                        <p className="text-xs text-stone-500">{new Date(sale.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} · {sale.payment_method === 'card' ? 'Tarjeta' : 'Cash'}{sale.client_email ? ` · ${sale.client_email}` : ''}</p>
                      </div>
                      <b className="text-[#da4d73]">{eur(sale.total_cents / 100)}</b>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {items.length === 0 && <p className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-500">Sin lineas de ticket guardadas.</p>}
                      {items.map(item => (
                        <div key={item.id} className="rounded-xl bg-stone-50 px-3 py-2 text-xs">
                          <div className="flex justify-between gap-3"><span className="font-bold">{item.name}</span><span>{eur(item.total_cents / 100)}</span></div>
                          <p className="mt-1 text-stone-400">{item.item_type === 'product' ? 'Producto' : 'Servicio'} · Cant. {item.quantity} · {eur(item.unit_price_cents / 100)} ud.</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  </Panel>;
}

function StaffView({ staff, editingStaff, setEditingStaff, saveStaff, removeStaff }: { staff: AdminStaff[]; editingStaff: AdminStaff; setEditingStaff: React.Dispatch<React.SetStateAction<AdminStaff>>; saveStaff: () => Promise<void>; removeStaff: (id?: string) => Promise<void> }) {
  return <Panel title="Peluqueros y accesos"><div className="mb-5 grid gap-3 md:grid-cols-3"><Field label="Nombre" value={editingStaff.name} onChange={v => setEditingStaff(s => ({ ...s, name: v }))} /><Field label="Email acceso" value={editingStaff.email} onChange={v => setEditingStaff(s => ({ ...s, email: v }))} /><Field label="Password" type="password" value={editingStaff.password || ''} onChange={v => setEditingStaff(s => ({ ...s, password: v }))} /><Field label="Rol" value={editingStaff.role} onChange={v => setEditingStaff(s => ({ ...s, role: v }))} /><Field label="PIN tactil" value={editingStaff.pin || ''} onChange={v => setEditingStaff(s => ({ ...s, pin: v }))} /><label className="flex items-end gap-2 text-xs font-bold"><input type="checkbox" checked={editingStaff.is_admin === true} onChange={e => setEditingStaff(s => ({ ...s, is_admin: e.target.checked }))} /> Admin</label></div><button onClick={saveStaff} className="mb-5 rounded-full bg-[#da4d73] px-5 py-2 text-xs font-bold uppercase text-white">Guardar peluquero</button><div className="grid gap-3 md:grid-cols-2">{staff.map(s => <div key={s.id} className="rounded-xl border border-rose-100 p-4"><p className="font-bold">{s.name}</p><p className="text-xs text-stone-500">{s.email} · {s.role} {s.is_admin ? '· Admin' : ''}</p><div className="mt-3 flex gap-2"><button onClick={() => setEditingStaff(s)} className="rounded-lg border border-rose-100 px-3 py-1 text-xs font-bold">Editar</button><button onClick={() => removeStaff(s.id)} className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">Desactivar</button></div></div>)}</div></Panel>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl"><h3 className="mb-5 font-serif text-2xl font-bold text-stone-950">{title}</h3>{children}</section>;
}


