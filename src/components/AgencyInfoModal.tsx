/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Globe, 
  TrendingUp, 
  Coins, 
  KeyRound, 
  MapPin, 
  Smartphone, 
  Award, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles,
  Heart,
  FileCheck,
  Zap,
  Users
} from 'lucide-react';

interface AgencyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgencyInfoModal({ isOpen, onClose }: AgencyInfoModalProps) {
  const [activeTab, setActiveTab] = useState<'why-web' | 'pricing' | 'ownership'>('why-web');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Ibiza season booking comparison data (with web/SEO vs without web/SEO)
  const ibizaSeasonData = [
    { month: 'Mayo', withWeb: 45, withoutWeb: 15, label: 'Inicio de Temporada' },
    { month: 'Junio', withWeb: 95, withoutWeb: 24, label: 'Llegada masiva' },
    { month: 'Julio', withWeb: 155, withoutWeb: 38, label: 'Temporada Alta' },
    { month: 'Agosto', withWeb: 180, withoutWeb: 42, label: 'Pico de turistas' },
    { month: 'Septiembre', withWeb: 120, withoutWeb: 28, label: 'Cierre de discotecas' },
    { month: 'Octubre', withWeb: 65, withoutWeb: 18, label: 'Turismo relax' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-950/45 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 30, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col md:flex-row max-h-[90vh] text-stone-800"
        >
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 bg-gradient-to-b from-rose-50/70 via-white to-rose-50/30 p-6 md:p-8 border-b md:border-b-0 md:border-r border-rose-100 flex flex-col justify-between shrink-0">
            <div>
              {/* Header inside sidebar */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#da4d73] to-rose-450 text-white flex items-center justify-center shadow-md">
                  <Globe className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-stone-900 leading-tight">Impulso Digital</h3>
                  <p className="text-[10px] text-stone-400 font-sans uppercase font-bold tracking-wider">Tu Web en Ibiza</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('why-web')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-2.5 cursor-pointer ${
                    activeTab === 'why-web'
                      ? 'bg-[#da4d73] text-white shadow-md shadow-rose-500/10'
                      : 'text-stone-600 hover:bg-rose-50/50 hover:text-[#da4d73]'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>Importancia de la Web</span>
                </button>

                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-2.5 cursor-pointer ${
                    activeTab === 'pricing'
                      ? 'bg-[#da4d73] text-white shadow-md shadow-rose-500/10'
                      : 'text-stone-600 hover:bg-rose-50/50 hover:text-[#da4d73]'
                  }`}
                >
                  <Coins className="w-4 h-4 shrink-0" />
                  <span>Precios Adaptados</span>
                </button>

                <button
                  onClick={() => setActiveTab('ownership')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-2.5 cursor-pointer ${
                    activeTab === 'ownership'
                      ? 'bg-[#da4d73] text-white shadow-md shadow-rose-500/10'
                      : 'text-stone-600 hover:bg-rose-50/50 hover:text-[#da4d73]'
                  }`}
                >
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>Propiedad Garantizada</span>
                </button>
              </div>
            </div>

            {/* Quote of the day */}
            <div className="hidden md:block pt-6 border-t border-rose-100/70">
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex flex-col gap-1.5">
                <div className="flex gap-0.5 text-amber-500">
                  <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">Ibiza Experience</span>
                </div>
                <p className="text-[10px] text-stone-600 font-sans leading-relaxed italic">
                  "El 92% de los turistas de paso eligen su salón de peluquería en la isla buscando en internet antes de acudir."
                </p>
              </div>
            </div>
          </div>

          {/* Modal Right Side Content Pane */}
          <div className="flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto flex flex-col justify-between max-h-[75vh] md:max-h-[90vh]">
            
            {/* Header / Dismiss Button */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#da4d73] bg-rose-50 px-3 py-1 rounded-full border border-rose-150">
                  {activeTab === 'why-web' && 'Estrategia de Adquisición de Clientes'}
                  {activeTab === 'pricing' && 'Flexibilidad Horaria y Finanzas'}
                  {activeTab === 'ownership' && 'Garantías de Transparencia Tecnológica'}
                </span>
                <h2 className="font-serif text-2xl md:text-3xl text-stone-900 font-bold mt-2">
                  {activeTab === 'why-web' && 'Por qué necesitas una Web en Ibiza'}
                  {activeTab === 'pricing' && 'Tarifas transparentes adaptadas a ti'}
                  {activeTab === 'ownership' && 'El 100% de la Web es tuyo de por vida'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-rose-50 transition-all text-stone-400 hover:text-stone-800 cursor-pointer border border-transparent hover:border-rose-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Content Views */}
            <div className="flex-1 mb-8">
              <AnimatePresence mode="wait">
                {activeTab === 'why-web' && (
                  <motion.div
                    key="why-web-content"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                      Ibiza es una isla con una particularidad única: <b>millones de clientes están de paso constantemente</b>. Estos turistas, residentes de temporada alta y visitantes temporales no conocen las calles ni tienen salones fijos. Cuando necesitan servicios urgentes como peluquería, tinte, manicura o masajes, recurren al instante a buscar en:
                    </p>

                    {/* Channel Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[#da4d73] mb-3">
                          <Globe className="w-4 h-4" />
                        </div>
                        <h4 className="font-sans text-xs font-bold text-stone-900 mb-1">Motores de Búsqueda</h4>
                        <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                          Aparecer primero cuando buscan "peluquería orgánica ibiza" o "mejor balayage sant jordi".
                        </p>
                      </div>

                      <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-3">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <h4 className="font-sans text-xs font-bold text-stone-900 mb-1">Local SEO & Google Maps</h4>
                        <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                          Tener una web optimizada multiplica por diez tu visibilidad en los mapas locales cuando están en ruta.
                        </p>
                      </div>

                      <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-3">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <h4 className="font-sans text-xs font-bold text-stone-900 mb-1">Redes & Link-in-Bio</h4>
                        <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                          Instagram y TikTok captan la atención visual, pero la web es el embudo definitivo para formalizar citas sin intermediarios.
                        </p>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="bg-rose-50/20 rounded-2xl p-5 border border-rose-100/50">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <div>
                          <h4 className="font-sans text-xs font-bold text-stone-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <TrendingUp className="w-4 h-4 text-[#da4d73]" />
                            Simulación de Citas Mensuales (Ibiza)
                          </h4>
                          <p className="text-[10px] text-stone-400">Canalizadores Online vs. Tradicional Solo Boca a Boca</p>
                        </div>
                        <div className="flex gap-4 text-[10px] font-semibold">
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 bg-[#da4d73] rounded-sm"></span>
                            Con Web Propia
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 bg-stone-300 rounded-sm"></span>
                            Boca a boca clásico
                          </span>
                        </div>
                      </div>

                      {/* Custom Responsive Animated Chart */}
                      <div className="h-44 sm:h-52 flex items-end justify-between pt-6 border-b border-rose-100 pb-2 relative font-sans">
                        
                        {/* Background lines */}
                        <div className="absolute inset-x-0 top-1/4 border-t border-rose-100/40 pointer-events-none" />
                        <div className="absolute inset-x-0 top-1/2 border-t border-rose-100/40 pointer-events-none" />
                        <div className="absolute inset-x-0 top-3/4 border-t border-rose-100/40 pointer-events-none" />

                        {ibizaSeasonData.map((data, idx) => {
                          const heightWithWeb = (data.withWeb / 200) * 100;
                          const heightWithoutWeb = (data.withoutWeb / 200) * 100;

                          return (
                            <div 
                              key={data.month} 
                              className="flex-1 flex flex-col items-center group relative cursor-help"
                              onMouseEnter={() => setHoveredBar(idx)}
                              onMouseLeave={() => setHoveredBar(null)}
                            >
                              {/* Tooltip Overlay */}
                              {hoveredBar === idx && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: -5, scale: 1 }}
                                  className="absolute bottom-full mb-2 bg-stone-900 text-white text-[10px] p-2.5 rounded-xl border border-stone-800 shadow-xl z-20 w-36 text-center leading-relaxed"
                                >
                                  <p className="font-bold text-rose-300">{data.month}</p>
                                  <p className="text-gray-300">Con Web: <span className="font-bold text-white">{data.withWeb} citas</span></p>
                                  <p className="text-gray-300">Tradicional: <span className="font-bold text-white">{data.withoutWeb} citas</span></p>
                                  <p className="text-[9px] mt-1 text-[#da4d73] italic">{data.label}</p>
                                </motion.div>
                              )}

                              {/* Bars Side-by-Side */}
                              <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-36">
                                {/* Bar 1 (With Web) */}
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${heightWithWeb}%` }}
                                  transition={{ type: 'spring', damping: 15, delay: idx * 0.05 }}
                                  className="w-4 sm:w-7 bg-gradient-to-t from-[#da4d73] to-rose-450 rounded-t-md relative shadow-sm group-hover:brightness-110 transition-all"
                                >
                                  <span className="hidden sm:block absolute -top-4 left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-[#da4d73]">
                                    {data.withWeb}
                                  </span>
                                </motion.div>

                                {/* Bar 2 (Without Web) */}
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${heightWithoutWeb}%` }}
                                  transition={{ type: 'spring', damping: 15, delay: idx * 0.05 + 0.1 }}
                                  className="w-4 sm:w-7 bg-stone-300 rounded-t-md relative shadow-sm"
                                >
                                  <span className="hidden sm:block absolute -top-4 left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-stone-500">
                                    {data.withoutWeb}
                                  </span>
                                </motion.div>
                              </div>

                              {/* Label */}
                              <span className="text-[9px] font-bold text-stone-500 mt-2 font-mono uppercase tracking-wide">
                                {data.month}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 mt-3 text-[10px] text-stone-500 font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span><b>Conclusión:</b> Un sitio web con buen SEO de búsqueda multiplica por 4 las reservas de clientes extranjeros y temporales.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'pricing' && (
                  <motion.div
                    key="pricing-content"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                      Creemos firmemente en relaciones sanas y duraderas. Por eso, huyendo de presupuestos cerrados excesivos o plantillas genéricas impersonales, optamos por la flexibilidad mutua:
                    </p>

                    <div className="bg-gradient-to-br from-rose-55/65 to-neutral-50/50 p-6 rounded-2xl border border-rose-100 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-[#da4d73] shrink-0 mt-1">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-sans text-xs font-bold text-stone-900 uppercase tracking-wide">Adaptado a tus Necesidades Reales</h4>
                          <p className="text-xs text-stone-500 leading-relaxed font-sans mt-1">
                            Los precios nosotros los ponemos en base a las necesidades del cliente y nos adaptamos para llegar a crear un acuerdo donde ambas partes queden contentas, no solo el primer día sino para siempre.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 pt-4 border-t border-rose-100/50">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-1">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-sans text-xs font-bold text-stone-900 uppercase tracking-wide">Relación Colaborativa de Confianza</h4>
                          <p className="text-xs text-stone-500 leading-relaxed font-sans mt-1">
                            No te vendemos humo ni te cobramos costes fantasmas. Ajustamos las funcionalidades de agenda, catálogo interactivo, idiomas (crucial para turistas franceses, ingleses o alemanes en Ibiza) según la etapa de tu negocio.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 pt-4 border-t border-rose-100/50">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0 mt-1">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-sans text-xs font-bold text-stone-900 uppercase tracking-wide">Transparencia de Costes y Mantenimiento</h4>
                          <p className="text-xs text-stone-500 leading-relaxed font-sans mt-1">
                            El mantenimiento incluye soporte diario, actualizaciones de seguridad obligatorias en servidores en la nube y optimización de contenido. Si tu presupuesto cambia, nos sentamos a ajustar los términos para seguir de la mano.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-150 flex items-center gap-3">
                      <Zap className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-[11px] text-amber-800 leading-snug font-sans">
                        <b>Trato de tú a tú:</b> Buscamos socios, no clientes efímeros. Tu éxito financiero en el salón impulsará nuestro crecimiento técnico mutuo.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'ownership' && (
                  <motion.div
                    key="ownership-content"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                      Muchas agencias de diseño de páginas web atan a sus clientes "alquilándoles" el código o cobrándoles de por vida bajo la amenaza de perder su negocio si se dan de baja. Nosotros trabajamos con total honestidad:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Guarantee Card 1 */}
                      <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200/60 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center mb-3">
                          <FileCheck className="w-4 h-4 text-green-400" />
                        </div>
                        <h4 className="font-sans text-xs font-bold text-stone-900 mb-1.5 flex items-center gap-1.5">
                          <span>Propiedad Intelectual Garantizada</span>
                        </h4>
                        <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                          Todos los derechos de explotación sobre el sitio web son del cliente de manera exclusiva e irrevocable una vez realizado el pago.
                        </p>
                      </div>

                      {/* Guarantee Card 2 */}
                      <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200/60 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center mb-3">
                          <KeyRound className="w-4 h-4 text-amber-450" />
                        </div>
                        <h4 className="font-sans text-xs font-bold text-stone-900 mb-1.5 flex items-center gap-1.5">
                          <span>Sin Ataduras ni Lock-In</span>
                        </h4>
                        <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                          Si en algún momento decides prescindir de nuestro servicio de mantenimiento mensual, todos los archivos del código fuente, contenidos, imágenes y repositorios web de GitHub te serán entregados de forma inmediata limpia.
                        </p>
                      </div>
                    </div>

                    <div className="bg-rose-50/40 rounded-2xl p-5 border border-rose-100 flex flex-col sm:flex-row gap-4 items-center">
                      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-[#da4d73] shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                      <div className="text-center sm:text-left font-sans">
                        <h4 className="text-xs font-bold text-stone-900">Libertad Absoluta de Hospedaje</h4>
                        <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                          Podrás alojar tu web en cualquier servidor del mundo. Tu código está escrito bajo estándares abiertos de TypeScript, HTML y CSS limpios, haciéndolo 100% portable.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-stone-900 rounded-2xl border border-stone-800 text-stone-300">
                      <p className="text-[10px] text-stone-400 font-mono flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span>COMPROMISO CONTRACTUAL IMPATIBLE</span>
                      </p>
                      <p className="text-[11px] leading-relaxed mt-2 text-stone-300">
                        "Crear valor mediante la libertad y la confianza. Un cliente libre de irse que elige quedarse con nosotros para la gestión integral de su negocio es el mayor premio a nuestra excelencia."
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA Footer inside Modal */}
            <div className="pt-6 border-t border-rose-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-rose-50/20 px-4 py-3 rounded-2xl border border-rose-100/50">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#da4d73] shrink-0" />
                <span className="text-xs font-bold text-stone-700 font-sans">
                  {activeTab === 'why-web' && '¡Multiplica tu visibilidad en la isla de Ibiza hoy!'}
                  {activeTab === 'pricing' && 'Cuéntanos tu presupuesto y crearemos el acuerdo perfecto.'}
                  {activeTab === 'ownership' && 'Traspaso de activos completo sin letra pequeña.'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-full sm:w-auto bg-[#da4d73] text-white hover:bg-[#ec4899] px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-rose-500/20 cursor-pointer text-center"
              >
                Entendido, ¡gracias!
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
