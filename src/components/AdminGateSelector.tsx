/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Sparkles, 
  Coins, 
  CalendarDays, 
  CreditCard, 
  TrendingUp, 
  ShieldAlert, 
  Check, 
  ArrowRight,
  X,
  Phone,
  BarChart3,
  Flame,
  Info
} from 'lucide-react';
import { ADMIN_AVATAR } from '../data';

interface AdminGateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInternal: () => void;
  onSelectFresha: () => void;
}

export default function AdminGateSelector({
  isOpen,
  onClose,
  onSelectInternal,
  onSelectFresha
}: AdminGateSelectorProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop (rendered as fixed to prevent scrolling issues with absolute child) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-0"
      />

      {/* Selector Container */}
      <motion.div
        initial={{ scale: 0.95, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 30, opacity: 0 }}
        className="relative w-full max-w-3xl bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-y-auto border border-rose-100 z-10 text-stone-800 my-auto max-h-[90vh] md:max-h-none"
      >
        {/* Glowing Orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 p-2 hover:bg-rose-50 rounded-full transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-rose-100 mb-3">
              <Lock className="w-3 h-3" /> Panel Prototipo Profesional
            </span>
            <h3 className="font-serif text-3.5xl font-bold text-stone-900 leading-tight">
              ¿Cómo deseas gestionar la peluquería?
            </h3>
            <p className="font-sans text-xs text-stone-500 mt-2">
              Compara las dos arquitecturas de agenda y reservas que hemos preparado para el negocio de Analei.
            </p>
          </div>

          {/* Dual Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            
            {/* Column 1: Internal Custom Tool */}
            <div className="border border-rose-100 bg-white/50 hover:bg-white rounded-2.5xl p-6 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-rose-100/30 group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-[#2f8f83] border border-rose-100">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                    Sin comisiones
                  </span>
                </div>

                <h4 className="font-serif text-xl font-bold text-stone-900 mb-1 leading-snug group-hover:text-[#2f8f83] transition-colors">
                  Menú Propio Analei
                </h4>
                <p className="text-[11px] text-[#2f8f83] font-bold uppercase tracking-wide mb-3">
                  Tu agenda local exclusiva
                </p>

                <p className="text-xs text-stone-500 leading-relaxed mb-5">
                  Un sistema local a medida integrado directamente en la web de tus clientes. Sencillo, elegante, y 100% libre de cuotas mensuales.
                </p>

                {/* Features Checklist */}
                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-start gap-2 text-xs text-stone-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><b>0% Comisiones:</b> Sin cuotas ocultas por cita reservada.</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-stone-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><b>Personalización Total:</b> Cambia ritmos, textos y productos al instante.</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-stone-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><b>Base de Datos Directa:</b> Los correos de tus clientes te pertenecen de forma local.</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  onSelectInternal();
                  onClose();
                }}
                className="w-full py-3.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#2f8f83] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Entrar al Menú Propio
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Column 2: Fresha Platform Motor */}
            <div className="border border-[#7c3aed]/20 bg-gradient-to-b from-[#7c3aed]/5 to-white/50 hover:bg-white rounded-2.5xl p-6 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-purple-100/30 group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#e0f2fe] text-[#0369a1] text-[9px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-[#0369a1]/10">
                Súper Integrado
              </div>
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-[#7c3aed] border border-purple-100">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <span className="bg-purple-100 text-[#7c3aed] text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-purple-200 uppercase tracking-widest animate-pulse">
                    Motor Fresha
                  </span>
                </div>

                <h4 className="font-serif text-xl font-bold text-stone-900 mb-1 leading-snug group-hover:text-[#7c3aed] transition-colors">
                  Motor Fresha Pro
                </h4>
                <p className="text-[11px] text-[#7c3aed] font-bold uppercase tracking-wide mb-3">
                  Arquitectura con coste extra
                </p>

                <p className="text-xs text-stone-500 leading-relaxed mb-5">
                  Prueba la simulación interactiva de Fresha, el software líder mundial que reduce cancelaciones tardías e integra pasarelas de pago automáticas.
                </p>

                {/* Features Checklist */}
                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-start gap-2 text-xs text-stone-600">
                    <Check className="w-4 h-4 text-[#7c3aed] shrink-0 mt-0.5" />
                    <span><b>Coste Financiero Extra:</b> Comisiones por transacción más cuota de recordatorios.</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-stone-600">
                    <Check className="w-4 h-4 text-[#7c3aed] shrink-0 mt-0.5" />
                    <span><b>No-Shows Control:</b> Pide fianza al reservar para proteger el tiempo de Analei.</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-stone-600">
                    <Check className="w-4 h-4 text-[#7c3aed] shrink-0 mt-0.5" />
                    <span><b>Pagos Seguros:</b> Cobra por adelantado o al final desde la agenda táctil.</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  onSelectFresha();
                  onClose();
                }}
                className="w-full py-3.5 bg-[#7c3aed] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#6d28d9] hover:shadow-lg hover:shadow-purple-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Probar Demo de Fresha
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Subtle note about costs */}
          <div className="mt-8 pt-4 border-t border-stone-100 flex items-center gap-2 text-[11px] text-stone-500 justify-center">
            <Info className="w-4 h-4 text-purple-600" />
            <span>Nota: El motor de Fresha puede requerir un coste extra mensual y comisiones sobre cobros.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
