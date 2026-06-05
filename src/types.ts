/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  date: string; // Format: YYYY-MM-DD
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'NoShow';
  price: number;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  paymentGuaranteeStatus?: 'secured' | 'not_required' | 'charged' | 'charge_failed';
  noShowFeeAmount?: number;
  noShowChargeId?: string;
  avatarColor: string; // CSS color or Tailwind class indicator
}

export type ServiceCategory = 'facials' | 'hair' | 'nails' | 'wellness';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  duration: string;
  price: number;
  iconName: string; // Matches Lucide Icon names
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
}
