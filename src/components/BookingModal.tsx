/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Sparkles, Check, Scissors, User } from 'lucide-react';
import { SERVICES } from '../data';
import { Appointment } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (appointment: Omit<Appointment, 'id' | 'clientInitials' | 'avatarColor'>) => void;
}

export default function BookingModal({ isOpen, onClose, onBook }: BookingModalProps) {
  const [clientName, setClientName] = useState('');
  const [selectedService, setSelectedService] = useState(SERVICES[0].name);
  const [selectedDate, setSelectedDate] = useState('2024-10-24');
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [isSuccess, setIsSuccess] = useState(false);

  const times = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:30 PM', '05:30 PM'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    // Trigger callback
    onBook({
      clientName: clientName.trim(),
      service: selectedService,
      time: selectedTime,
      date: selectedDate,
      status: 'Pending',
      price: SERVICES.find(s => s.name === selectedService)?.price || 50
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setClientName('');
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            id="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-md z-0"
          />

          {/* Modal Content */}
          <motion.div
            id="booking-modal-card"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="relative w-full max-w-lg bg-[#fffbfb] backdrop-blur-2xl rounded-2xl shadow-2xl overflow-y-auto border border-rose-100 z-10 text-stone-800 my-auto max-h-[90vh]"
          >
            {isSuccess ? (
              <div className="p-12 text-center flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-transparent">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-[#da4d73] rounded-full flex items-center justify-center text-white mb-6 border border-rose-150 shadow-[0_0_15px_rgba(218,77,115,0.4)]"
                >
                  <Check className="w-8 h-8 font-extrabold" />
                </motion.div>
                <h3 className="font-serif text-2xl text-stone-900 font-bold mb-2">¡Reserva Solicitada con éxito!</h3>
                <p className="font-sans text-xs text-stone-650 max-w-sm leading-relaxed">
                  Hemos agendado tu cita de <span className="font-bold text-[#da4d73]">{selectedService}</span> para el <span className="font-bold text-stone-900">{selectedDate}</span> a las <span className="font-bold text-stone-900">{selectedTime}</span>.
                </p>
              </div>
            ) : (
              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-serif text-2xl text-[#da4d73] flex items-center gap-2 font-bold">
                      <Sparkles className="w-6 h-6 text-[#da4d73] fill-[#da4d73]/20" />
                      Pedir Cita Online
                    </h3>
                    <p className="font-sans text-xs text-stone-500 mt-1">Reserva tu tratamiento favorito de forma rápida y sencilla.</p>
                  </div>
                  <button
                    id="close-booking-btn"
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors text-stone-450 hover:text-stone-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Client Name */}
                  <div>
                    <label id="label-client-name" className="block font-sans text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="input-client-name"
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ej. Carmen Soler"
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-rose-150 focus:outline-[#da4d73] focus:border-[#da4d73] focus:ring-1 focus:ring-[#da4d73] transition-all text-xs text-stone-800 placeholder:text-stone-400 font-sans shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Treatment Choice */}
                  <div>
                    <label id="label-service" className="block font-sans text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                      Seleccionar Servicio
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <select
                        id="select-service-booking"
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-rose-150 focus:outline-[#da4d73] focus:border-[#da4d73] focus:ring-1 focus:ring-[#da4d73] transition-all text-xs text-stone-800 appearance-none font-sans cursor-pointer shadow-sm"
                      >
                        {SERVICES.map((s) => (
                          <option key={s.id} value={s.name} className="bg-white text-stone-800 font-sans text-xs p-2">
                            {s.name} — €{s.price} ({s.duration})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date and Time Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date picker */}
                    <div>
                      <label id="label-date" className="block font-sans text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                        Fecha
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <input
                          id="input-booking-date"
                          type="date"
                          required
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-rose-150 focus:outline-[#da4d73] focus:border-[#da4d73] focus:ring-1 focus:ring-[#da4d73] text-xs text-stone-800 font-sans [color-scheme:light] shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Time picker list */}
                    <div>
                      <label id="label-time" className="block font-sans text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                        Hora
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                          <Clock className="w-4 h-4" />
                        </div>
                        <select
                          id="select-booking-time"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-rose-150 focus:outline-[#da4d73] focus:border-[#da4d73] focus:ring-1 focus:ring-[#da4d73] text-xs text-stone-800 appearance-none font-sans cursor-pointer shadow-sm"
                        >
                          {times.map((t) => (
                            <option key={t} value={t} className="bg-white text-stone-800 text-xs">
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-rose-50/40 rounded-xl p-4 border border-rose-100 text-stone-800">
                    <h4 className="font-sans text-xs text-stone-800 uppercase tracking-wider mb-2 font-bold">Resumen del Ritual</h4>
                    <div className="space-y-1.5 text-xs text-stone-600 font-sans">
                      <div className="flex justify-between">
                        <span>Tratamiento:</span>
                        <span className="font-bold text-stone-800">{selectedService}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precio estimado:</span>
                        <span className="font-bold text-[#da4d73]">€{SERVICES.find(s => s.name === selectedService)?.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fecha y hora:</span>
                        <span className="font-mono text-stone-850 font-bold">{selectedDate} @ {selectedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex gap-3 pt-2">
                    <button
                      id="cancel-booking-btn"
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-full border border-rose-150 hover:bg-rose-50 text-stone-600 transition-colors cursor-pointer bg-white"
                    >
                      Cancelar
                    </button>
                    <button
                      id="submit-booking-btn"
                      type="submit"
                      className="flex-1 bg-[#da4d73] text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-500/20 text-center cursor-pointer"
                    >
                      Confirmar Reserva
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
