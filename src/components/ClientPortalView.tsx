/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Scissors,
  Sparkles,
  Heart,
  Flame,
  ArrowRight,
  Verified,
  Droplet,
  Smile,
  CheckCircle,
  Mail,
  Instagram,
  Facebook,
  ChevronRight,
  BookOpen,
  ShoppingBag,
  Clock,
  Star,
} from 'lucide-react';
import { SERVICES, FEATURED_PRODUCTS, BEAUTY_ARTICLES, LANDING_HERO_IMAGE } from '../data';
import { Service, Product, Article } from '../types';
import LogoMaria from './LogoMaria';

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
  const [activeCategory, setActiveCategory] = useState<'all' | 'facials' | 'hair' | 'nails' | 'wellness'>('all');
  const displayServices = services.length ? services : SERVICES;
  const displayProducts = products.length ? products : FEATURED_PRODUCTS;
  const displayArticles = articles.length ? articles : BEAUTY_ARTICLES;
  const [selectedProduct, setSelectedProduct] = useState<Product>(displayProducts[0]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Filter services by category
  const filteredServices = activeCategory === 'all'
    ? displayServices
    : displayServices.filter(s => s.category === activeCategory);

  useEffect(() => {
    setSelectedProduct(displayProducts[0]);
  }, [displayProducts[0]?.id]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    await import('../lib/supabase').then(({ invokeFunction }) =>
      invokeFunction('admin-panel', { action: 'subscribe_newsletter', email: newsletterEmail.trim(), source: 'home' })
    ).catch(() => undefined);
    setNewsletterSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSuccess(false), 3000);
  };

  const categoryIcons = {
    facials: <Sparkles className="w-8 h-8" />,
    hair: <Scissors className="w-8 h-8" />,
    nails: <Heart className="w-8 h-8" />,
    wellness: <Flame className="w-8 h-8" />
  };

  return (
    <div className="min-h-screen bg-[#fffbfb] text-[#201315] selection:bg-[#da4d73]/15 selection:text-[#da4d73] relative overflow-x-clip">
      
      {/* Dynamic Luminous Ambient Blur Elements (Soft Skin & Peony Glows) */}
      <div className="absolute top-[0px] left-[-150px] w-[500px] h-[500px] bg-rose-100 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[-100px] w-[600px] h-[600px] bg-[#da4d73]/8 rounded-full blur-[200px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] left-[-200px] w-[600px] h-[600px] bg-amber-100/50 rounded-full blur-[160px] pointer-events-none z-0"></div>
      
      {/* TopNavBar Client Section (Frosted Glass Light Beauty Theme) */}
      <nav id="navbar" className="sticky top-0 z-40 bg-white/75 backdrop-blur-2xl border-b border-rose-100 transition-all duration-300 w-full shadow-xs">
        <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-7xl mx-auto">
          {/* Brand Logo */}
          <a href="#" className="hover:opacity-95 transition-opacity flex items-center gap-1">
            <LogoMaria className="flex flex-col items-center" textClass="text-2xl pt-1.5" />
          </a>

          {/* Desktop Navigation Links (Translucent Light Hub) */}
          <ul className="hidden md:flex gap-8 items-center bg-[#ffeef1]/50 px-8 py-2.5 rounded-full border border-rose-100/60 backdrop-blur-xl">
            <li><a href="#hero" className="text-[#da4d73] font-bold text-sm transition-colors tracking-wide">Inicio</a></li>
            <li><a href="#services" className="text-stone-600 hover:text-[#da4d73] text-sm font-semibold transition-colors">Servicios</a></li>
            <li><a href="#products" className="text-stone-600 hover:text-[#da4d73] text-sm font-semibold transition-colors">Productos</a></li>
            <li><a href="#tips" className="text-stone-600 hover:text-[#da4d73] text-sm font-semibold transition-colors">Consejos</a></li>
            <li><a href="#footer" className="text-[#bf3b5b] hover:text-[#da4d73] text-sm font-bold transition-colors">Contacto</a></li>
          </ul>

          {/* Actions Bar */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Book Now Button  */}
            <button
              onClick={onOpenBooking}
              className="inline-flex items-center justify-center bg-[#da4d73] text-white hover:bg-[#ec4899] px-4 sm:px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-rose-500/20 hover:-translate-y-0.5 active:translate-y-0 text-[11px] transition-all duration-300 cursor-pointer shadow-md"
            >
              Reservar Cita
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 px-6 md:px-12 overflow-hidden flex items-center z-10">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          
          <div className="flex flex-col gap-6 order-2 lg:order-1 relative z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#da4d73]/10 border border-[#da4d73]/20 text-[#da4d73] font-bold text-xs uppercase tracking-widest w-fit backdrop-blur-md font-sans">
              ELEVA TU CONFIANZA
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-5.5xl text-[#201315] relative font-bold leading-tight">
              Belleza y Cuidado <br />
              <span className="text-[#da4d73] italic">Para cada versión de ti</span>
            </h1>
            
            <p className="font-sans text-stone-600 max-w-md text-base leading-relaxed font-normal">
              Tu santuario privado para peluquería excepcional, tratamientos faciales de vanguardia y terapias de bienestar holístico. Entra en un oasis diseñado para hacerte brillar con total seguridad.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center justify-center bg-[#da4d73] text-white hover:bg-[#ec4899] px-8 py-3.5 rounded-full font-bold text-sm tracking-wide uppercase shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 hover:-translate-y-1 transition-all duration-300 gap-2 cursor-pointer"
              >
                Reservar Servicio
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#services"
                className="px-6 py-3.5 text-stone-700 hover:text-stone-900 font-semibold text-sm transition-all border border-rose-200/60 rounded-full bg-white/80 hover:bg-rose-50/50 backdrop-blur-md"
              >
                Explorar Tratamientos
              </a>
            </div>

            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-rose-100 text-stone-500 font-semibold text-[11px] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Verified className="w-5 h-5 text-[#da4d73]" />
                <span>Estilistas Pro</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <span>Bio Cosmética</span>
              </div>
            </div>
          </div>

          {/* Hero Illustration (Framed with Frosted Edge glow) */}
          <div className="order-1 lg:order-2 relative h-[450px] lg:h-[585px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-rose-100 p-[1px] bg-gradient-to-tr from-rose-200 to-transparent">
            <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative bg-rose-50">
              <img
                src={LANDING_HERO_IMAGE}
                alt="Modelo radiante descansando en el salón de belleza María"
                className="absolute inset-0 w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
              <div className="hero-image-overlay absolute inset-0 bg-gradient-to-t from-[#fffbfb]/50 to-transparent"></div>
              {/* Floating Ultra Frosted Card Overlay */}
              <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-rose-100 max-w-[210px] transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <p className="font-serif text-xs text-center text-stone-800 leading-normal italic">
                  "El cuidado personal no es un capricho, es una necesidad."
                </p>
                <div className="flex justify-center mt-3 text-[#da4d73]">
                  <Heart className="w-4 h-4 fill-[#da4d73]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Treatments Section */}
      <section id="services" className="py-20 md:py-24 relative z-10 border-t border-rose-100 bg-white/20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-stone-900 font-bold mb-4">Nuestros Tratamientos Insignia</h2>
            <p className="font-sans text-stone-500 max-w-xl mx-auto text-sm md:text-base">
              Descubre una experiencia de relajación y alta estética diseñada para potenciar tu belleza natural única.
            </p>
          </div>

          {/* Quick Select categories (Frosted pill filters) */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#da4d73] text-white border-[#da4d73] shadow-lg shadow-rose-500/10 font-bold'
                  : 'bg-white text-stone-600 border-rose-100 hover:bg-rose-50/50'
              }`}
            >
              Todos
            </button>
            {(['facials', 'hair', 'nails', 'wellness'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#da4d73] text-white border-[#da4d73] shadow-lg shadow-rose-500/10 font-bold'
                    : 'bg-white text-stone-600 border-rose-100 hover:bg-rose-50/50'
                }`}
              >
                {cat === 'facials' ? 'Facial' : cat === 'hair' ? 'Peluquería' : cat === 'nails' ? 'Manicura' : 'Bienestar'}
              </button>
            ))}
          </div>

          {/* Dynamic Services Grid (Frosted grid plates) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredServices.map(service => (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-6 border border-rose-100/80 hover:border-rose-300 hover:bg-[#fffcfc] hover:-translate-y-1 hover:shadow-lg shadow-[0_4px_24px_rgba(218,77,115,0.03)] transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-center text-[#da4d73] mb-4 group-hover:scale-110 transition-transform">
                    {categoryIcons[service.category] || <Sparkles className="w-6 h-6" />}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 mb-1.5 group-hover:text-[#da4d73] transition-colors leading-tight">
                    {service.name}
                  </h3>
                  <span className="inline-block text-[9px] font-bold text-[#da4d73] uppercase tracking-widest bg-rose-50 px-2.5 py-0.5 rounded-full mb-3 border border-rose-100">
                    {service.category} &bull; {service.duration}
                  </span>
                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-3 mb-4">
                    {service.description}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-rose-100">
                  <span className="text-lg font-bold text-stone-900">€{service.price}</span>
                  <button
                    onClick={onOpenBooking}
                    className="flex items-center gap-1 text-xs font-bold text-[#da4d73] hover:text-rose-600 group-hover:translate-x-1 transition-all cursor-pointer"
                  >
                    Reservar <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials de Clientes de Google */}
      <section id="opiniones" className="py-20 md:py-24 relative z-10 border-t border-rose-100 bg-white/40">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold uppercase tracking-wider mb-4">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Valoración 5.0 en Google Reviews</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-[#201315] font-bold mb-4">Lo que Opinan Nuestros Clientes</h2>
            <p className="font-sans text-stone-500 max-w-xl mx-auto text-sm">
              La máxima satisfacción y la sonrisa de quienes nos visitan es nuestro mayor compromiso de calidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white/85 backdrop-blur-xl p-8 rounded-3xl border border-rose-100 shadow-[0_8px_30px_rgba(218,77,115,0.02)] hover:border-rose-300 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-[#3b2a2c]/95 text-xs leading-relaxed italic font-sans mb-6">
                  "Grandes profesionales y mejores personas!! Trato exquisito y profesionalidad máxima. Mi lugar de confianza para que me dejen perfecto!! Siempre encantado cuando os voy a ver!!"
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-rose-50">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-[#da4d73] text-xs">
                  MT
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold text-stone-900 text-left">Miguel Tavira</h4>
                  <p className="text-[9px] text-stone-400 font-medium">Hace 6 meses • Opinión en Google</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white/85 backdrop-blur-xl p-8 rounded-3xl border border-rose-100 shadow-[0_8px_30px_rgba(218,77,115,0.02)] hover:border-rose-300 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-[#3b2a2c]/95 text-xs leading-relaxed italic font-sans mb-6">
                  "Muy profesionales, el chico que nos atendió corta súper bien, muy contenta con su trabajo. Es la segunda vez que vamos y volveremos."
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-rose-50">
                <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center font-bold text-purple-600 text-xs">
                  AN
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold text-stone-900 text-left">ANA</h4>
                  <p className="text-[9px] text-stone-400 font-medium">Hace 2 meses • Opinión en Google</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white/85 backdrop-blur-xl p-8 rounded-3xl border border-rose-100 shadow-[0_8px_30px_rgba(218,77,115,0.02)] hover:border-rose-300 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-[#3b2a2c]/95 text-xs leading-relaxed italic font-sans mb-6">
                  "Lugar ideal para relajarse, reir y salir esplendida para eventos y próximas fiestas os consejos llamar cuanto antes que la agenda está casi llena os esperan Berny Roy y Maria"
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-rose-50">
                <div className="w-10 h-10 rounded-full bg-rose-100/50 border border-rose-150 flex items-center justify-center font-bold text-rose-700 text-xs">
                  LR
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold text-stone-900 text-left">Lourdes Ramos</h4>
                  <p className="text-[9px] text-stone-400 font-medium">Hace 6 meses • Opinión en Google</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="py-20 md:py-24 relative z-10 border-t border-rose-100 mb-8 bg-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-stone-900 font-bold mb-4">Productos Recomendados</h2>
            <p className="font-sans text-stone-500 max-w-xl mx-auto text-sm">
              Cosmética y cuidado capilar premium de grado clínico y orgánico para continuar tu ritual de cuidado en casa.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-[2rem] p-6 md:p-10 border border-rose-100 shadow-[0_12px_40px_rgba(218,77,115,0.04)]">
            {/* Left Product Image Selector */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-rose-100 shadow-sm">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 bg-[#da4d73] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-sans">
                  {selectedProduct.tag || 'ECO PREMIUM'}
                </span>
              </div>
              
              {/* Selector thumbs block */}
              <div className="flex gap-2.5">
                {displayProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`flex-1 h-20 rounded-xl overflow-hidden border-2 transition-all relative cursor-pointer ${
                      p.id === selectedProduct.id ? 'border-[#da4d73] scale-95 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Product Info Details Column */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <span className="text-pink-600 text-xs font-bold uppercase tracking-widest">{selectedProduct.brand}</span>
              <h3 className="font-serif text-2xl md:text-3xl text-stone-900 mt-1 mb-4 font-bold">
                {selectedProduct.name}
              </h3>
              
              <p className="text-stone-600 text-sm leading-relaxed mb-6">
                {selectedProduct.description}
              </p>

              {/* Product USPs list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-bold text-xs text-stone-850 uppercase tracking-wider mb-2.5 font-sans">Características Clave</h4>
                  <ul className="space-y-2">
                    {(selectedProduct.features.length ? selectedProduct.features : ['Seleccion profesional', 'Disponible en salon']).map((f, i) => (
                      <li key={i} className="text-xs text-stone-600 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#da4d73] flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-xs text-stone-850 uppercase tracking-wider mb-2.5 font-sans">Ventajas</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedProduct.benefits.length ? selectedProduct.benefits : ['Recomendado']).map((b, i) => (
                      <span key={i} className="bg-rose-50 text-[#da4d73] text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-100">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Purchase action bar */}
              <div className="flex items-center gap-6 pt-5 border-t border-rose-100">
                <div className="text-3xl font-bold text-stone-900">€{selectedProduct.price}</div>
                <button
                  onClick={onOpenBooking}
                  className="bg-[#da4d73] text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#ec4899] hover:scale-105 transition-all w-fit shadow-md flex items-center gap-2 shadow-rose-500/10 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Consultar en Salón
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beauty Tips Grid Section */}
      <section id="tips" className="py-20 md:py-24 relative z-10 border-t border-rose-100 bg-white/20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900">Consejos de Belleza y Rutinas</h2>
              <p className="font-sans text-stone-500 mt-1.5 text-sm">Escritos por nuestros expertos esteticién para cuidar tu rostro y cabello diario.</p>
            </div>
            <a href="#tips" className="text-[#da4d73] font-bold text-md hover:underline mt-4 sm:mt-0 flex items-center gap-1">
              Ver Todos <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayArticles.map(article => (
              <div
                key={article.id}
                onClick={() => onReadArticle(article)}
                className="bg-white rounded-2xl overflow-hidden border border-rose-100 hover:border-rose-300 hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group shadow-[0_4px_24px_rgba(218,77,115,0.02)]"
                title="Hacer clic para leer el artículo completo"
              >
                <div className="h-44 w-full bg-rose-50 relative overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3 left-3 bg-white/95 text-[#da4d73] text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-100 shadow-sm font-sans">
                    {article.category}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between bg-white/50">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 mb-2 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{article.readTime}</span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-stone-900 mb-2 line-clamp-2 leading-snug group-hover:text-[#da4d73] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-3 mb-4">
                      {article.summary}
                    </p>
                  </div>
                  
                  <span className="text-xs font-bold text-[#da4d73] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Leer artículo <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter subscription box (Frosted Duo gradient plate) */}
          <div className="mt-20 bg-gradient-to-br from-rose-50 to-[#fff8f8] rounded-3xl p-6 md:p-10 border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#da4d73]/5 rounded-bl-full pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
              <div className="w-12 h-12 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-[#da4d73] flex-shrink-0 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#201315]">Stay Beautiful, Every Day.</h3>
                <p className="text-xs text-stone-600 font-sans">Recibe consejos de belleza, promociones exclusivas y lanzamientos en tu correo.</p>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="relative z-10 w-full md:w-auto max-w-md flex flex-col sm:flex-row gap-3">
              {newsletterSuccess ? (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-6 py-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> ¡Suscrito con éxito! Gracias por unirte.
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Escribe tu correo..."
                    className="px-5 py-3 bg-white rounded-full border border-rose-100 text-xs focus:outline-none focus:ring-1 focus:ring-[#da4d73] w-full sm:w-64 text-stone-800 placeholder:text-stone-400 shadow-inner"
                  />
                  <button
                    type="submit"
                    className="bg-[#da4d73] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-rose-600 active:scale-95 transition-all text-center flex-shrink-0 cursor-pointer shadow-md"
                  >
                    Suscribirse
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer Client Section */}
      <footer id="footer" className="bg-[#fff3f5]/55 border-t border-rose-100 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          <div className="flex flex-col gap-4">
            <a href="#" className="hover:opacity-95 transition-opacity flex items-start w-fit">
              <LogoMaria className="flex flex-col items-start" textClass="text-2xl pt-1.5" />
            </a>
            <p className="text-xs text-stone-500 leading-relaxed">
              Tu santuario acogedor de bienestar, alta peluquería, manicura y cuidado especializado de la piel.
            </p>
            <div className="flex gap-3 mt-2">
              <a href="https://www.instagram.com/_mariapeluqueria" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#da4d73] border border-rose-100 hover:bg-rose-50 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#da4d73] border border-rose-100 hover:bg-rose-50 transition-all">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#201315]">Explorar</h4>
            <div className="grid grid-cols-1 gap-2.5 text-xs text-stone-500 font-sans">
              <a href="#services" className="hover:text-[#da4d73] transition-colors">Nuestros Servicios</a>
              <a href="#products" className="hover:text-[#da4d73] transition-colors">Tienda Especializada</a>
              <a href="#tips" className="hover:text-[#da4d73] transition-colors">Consejos Rápidos</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Políticas de Privacidad registradas.'); }} className="hover:text-[#da4d73] transition-colors">Aviso de Privacidad</a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#201315]">Tratamientos</h4>
            <div className="grid grid-cols-1 gap-2.5 text-xs text-stone-500">
              <span>Balayage Francés & Corte</span>
              <span>Higiene Facial Profunda</span>
              <span>Manicura Spa de Lavanda</span>
              <span>Masaje Craneofacial Antiestrés</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#201315]">Contacto</h4>
            <div className="text-xs text-stone-500 space-y-2.5">
              <p className="flex items-start gap-2">
                <span className="inline-block w-2 h-2 bg-[#da4d73] rounded-full shadow-[0_0_8px_rgba(218,77,115,0.8)] mt-1.5 shrink-0"></span>
                <span>Carrer de la Ruda, 6, Local 6, 07817 Sant Jordi de ses Salines, Balearic Islands</span>
              </p>
              <p className="flex items-center gap-2 font-semibold text-stone-800">
                <span className="inline-block w-2 h-2 bg-pink-400 rounded-full"></span>
                +34 627 59 51 29
              </p>
              <p className="text-[10px] text-[#da4d73] font-bold font-mono tracking-wider uppercase bg-rose-50 px-2.5 py-1 rounded w-fit border border-rose-100">
                Lunes a Sábado: 9:00 AM - 8:30 PM
              </p>
            </div>
          </div>

        </div>

        <div className="mt-16 pt-6 border-t border-rose-100 max-w-7xl mx-auto px-6 md:px-12 text-center">
          <p className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
            &copy; 2026 Peluquería María y Estética. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
