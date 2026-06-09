/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Article, Product, Service } from '../types';
import { FEATURED_PRODUCTS, SERVICES } from '../data';
import PremiumScrollLanding from './PremiumScrollLanding';

interface ClientPortalViewProps {
  onOpenBooking: () => void;
  onReadArticle: (article: Article) => void;
  services: Service[];
  products: Product[];
  articles: Article[];
}

export default function ClientPortalView({
  onOpenBooking,
  onReadArticle,
  services,
  products,
  articles
}: ClientPortalViewProps) {
  const displayServices = services.length ? services : SERVICES;
  const displayProducts = products.length ? products : FEATURED_PRODUCTS;
  const googleReviews = [
    {
      name: 'Nerea Lopez',
      age: 'Hace 4 meses',
      initial: 'N',
      color: 'bg-[#c65a2e]',
      text: '5 estrellas por que sali muy contenta y feliz. Fui en un principio para cortarme las puntas y Esther me aconsejo para cubrir el color.'
    },
    {
      name: 'David Pastor',
      age: 'Hace 7 meses',
      initial: 'D',
      color: 'bg-[#285d7b]',
      text: 'Son profesionales, simpaticos y con un trato muy familiar, te hacen sentir comodo desde el primer momento. El corte de pelo, de 10.'
    },
    {
      name: 'Alberto Guzman',
      age: 'Hace 9 meses',
      initial: 'A',
      color: 'bg-[#765744]',
      text: 'Fui por primera vez a esta peluqueria y sali muy satisfecho. El trato fue excelente desde el primer momento, con un ambiente agradable y profesional.'
    }
  ];

  return <PremiumScrollLanding onOpenBooking={onOpenBooking} reviews={googleReviews} services={displayServices} products={displayProducts} />;
}
