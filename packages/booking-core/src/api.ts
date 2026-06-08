import { BookingClient } from './client';
import { appointmentFromDb } from './adapters';
import { AdminLoadData, Appointment, DbAppointment } from './types';

export const createBookingApi = (client: BookingClient) => ({
  loadAdminData: () =>
    client.invokeFunction<AdminLoadData>('admin-panel', { action: 'load' }),

  listAppointments: async () => {
    const payload = await client.invokeFunction<{ appointments: DbAppointment[] }>('list-appointments', {});
    return (payload.appointments || []).map(appointmentFromDb);
  },

  createSetupIntent: (body: unknown) =>
    client.invokeFunction<{
      clientSecret: string;
      customerId: string;
      serviceId: string;
      priceCents: number;
      noShowFeeCents: number;
    }>('create-setup-intent', body),

  completeBooking: (body: unknown) =>
    client.invokeFunction<{ appointment: DbAppointment }>('complete-booking', body),

  createAdminAppointment: (appointment: unknown) =>
    client.invokeFunction<{ appointment: DbAppointment }>('admin-panel', {
      action: 'create_appointment',
      appointment
    }),

  updateAppointmentStatus: (appointmentId: string, status: Appointment['status'], updates?: Partial<Appointment>) =>
    client.invokeFunction<{ appointment: DbAppointment }>('admin-panel', {
      action: 'update_appointment_status',
      appointmentId,
      status,
      ...updates
    }),

  chargeNoShow: (appointmentId: string) =>
    client.invokeFunction<{
      appointment: DbAppointment;
      paymentIntentId: string;
      status: string;
    }>('charge-no-show', { appointmentId }),

  savePolicy: (policy: unknown) =>
    client.invokeFunction('admin-panel', { action: 'save_policy', policy }),

  saveSettings: (settings: unknown) =>
    client.invokeFunction('admin-panel', { action: 'save_settings', settings }),

  saveService: (service: unknown) =>
    client.invokeFunction('admin-panel', { action: 'upsert_service', service }),

  deleteService: (id: string) =>
    client.invokeFunction('admin-panel', { action: 'delete_service', id }),

  saveProduct: (product: unknown) =>
    client.invokeFunction('admin-panel', { action: 'upsert_product', product }),

  deleteProduct: (id: string) =>
    client.invokeFunction('admin-panel', { action: 'delete_product', id }),

  saveClient: (clientProfile: unknown) =>
    client.invokeFunction('admin-panel', { action: 'upsert_client', client: clientProfile }),

  deleteClient: (id: string) =>
    client.invokeFunction('admin-panel', { action: 'delete_client', id }),

  savePost: (post: unknown) =>
    client.invokeFunction('admin-panel', { action: 'upsert_post', post }),

  deletePost: (id: string) =>
    client.invokeFunction('admin-panel', { action: 'delete_post', id }),

  subscribeNewsletter: (email: string, source = 'home') =>
    client.invokeFunction('admin-panel', { action: 'subscribe_newsletter', email, source }),

  sendNewsletter: (subject: string, bodyHtml: string, template = 'custom') =>
    client.invokeFunction('admin-panel', {
      action: 'send_newsletter',
      subject,
      body_html: bodyHtml,
      template
    }),

  closeRegister: (method: 'cash' | 'card' | 'all') =>
    client.invokeFunction('admin-panel', { action: 'close_register', method }),

  createSale: (sale: unknown, items: unknown[]) =>
    client.invokeFunction('admin-panel', { action: 'create_sale', sale, items })
});
