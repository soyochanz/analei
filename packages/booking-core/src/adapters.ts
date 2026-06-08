import { Appointment, Article, DbAppointment, Product, Service } from './types';

const avatarColors = [
  'bg-rose-50 text-[#da4d73] border border-rose-100',
  'bg-amber-50 text-amber-700 border border-amber-100',
  'bg-purple-50 text-[#a855f7] border border-purple-150',
  'bg-blue-50 text-blue-700 border border-blue-100',
  'bg-teal-50 text-teal-700 border border-teal-100'
];

export const appointmentFromDb = (ap: DbAppointment, index = 0): Appointment => ({
  id: ap.id,
  salonId: ap.salon_id,
  clientName: ap.client_name,
  clientEmail: ap.client_email,
  clientPhone: ap.client_phone,
  clientInitials: ap.client_name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
  service: ap.service_name,
  stylistId: ap.stylist_id,
  time: ap.appointment_time,
  date: ap.appointment_date,
  status: ap.status,
  price: Math.round((ap.price_cents || 0) / 100),
  stripeCustomerId: ap.stripe_customer_id,
  stripePaymentMethodId: ap.stripe_payment_method_id,
  paymentGuaranteeStatus: ap.payment_guarantee_status,
  noShowFeeAmount: Math.round((ap.no_show_fee_cents ?? 0) / 100),
  noShowChargeId: ap.no_show_charge_id,
  avatarColor: avatarColors[index % avatarColors.length]
});

export const serviceFromDb = (service: any): Service => ({
  id: service.id,
  name: service.name,
  description: service.description || '',
  category: service.category || 'hair',
  duration: `${service.duration_minutes || 60} min`,
  price: Math.round((service.price_cents || 0) / 100),
  iconName: service.icon_name || 'Scissors'
});

export const productFromDb = (product: any): Product => ({
  id: product.id,
  name: product.name,
  brand: product.brand || '',
  description: product.description || '',
  price: Math.round((product.price_cents || 0) / 100),
  image: product.image_url || '',
  features: [],
  tag: product.tag || '',
  benefits: [],
  isFeatured: product.is_featured === true
});

export const articleFromDb = (post: any): Article => ({
  id: post.id,
  title: post.title,
  category: post.category || 'Consejos',
  readTime: post.read_time || '3 min',
  summary: post.summary || '',
  content: post.content_html || '',
  contentHtml: post.content_html || '',
  image: post.cover_image_url || '',
  publishedDate: post.published_date || ''
});
