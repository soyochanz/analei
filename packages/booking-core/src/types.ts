export interface Appointment {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientInitials: string;
  service: string;
  stylistId?: string;
  stylistName?: string;
  time: string;
  date: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'NoShow';
  price: number;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  paymentGuaranteeStatus?: 'secured' | 'not_required' | 'charged' | 'charge_failed';
  noShowFeeAmount?: number;
  noShowChargeId?: string;
  avatarColor: string;
}

export type ServiceCategory = 'facials' | 'hair' | 'nails' | 'wellness';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  duration: string;
  price: number;
  iconName: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  image: string;
  features: string[];
  tag?: string;
  benefits: string[];
  isFeatured?: boolean;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  content: string;
  image: string;
  publishedDate: string;
  contentHtml?: string;
}

export type DbAppointment = {
  id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  service_name: string;
  stylist_id?: string;
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

export type AdminLoadData = {
  products: unknown[];
  services: unknown[];
  stylists: unknown[];
  staff: unknown[];
  sales: unknown[];
  saleItems: unknown[];
  closures: unknown[];
  settings?: unknown;
  policy?: unknown;
  posts: unknown[];
  subscribers: unknown[];
  clients?: unknown[];
  campaigns?: unknown[];
};
