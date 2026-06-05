/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Mail,
  Scissors,
  ShieldCheck,
  Sparkles,
  User,
  X
} from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { SERVICES } from '../data';
import { invokeFunction } from '../lib/supabase';
import { Appointment } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (appointment: Omit<Appointment, 'clientInitials' | 'avatarColor'>) => void;
}

const NO_SHOW_FEE_EUR = 40;

export default function BookingModal({ isOpen, onClose, onBook }: BookingModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedService, setSelectedService] = useState(SERVICES[0].name);
  const [selectedDate, setSelectedDate] = useState('2024-10-24');
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [isSuccess, setIsSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [setupCustomerId, setSetupCustomerId] = useState('');
  const [setupServiceId, setSetupServiceId] = useState('');
  const [setupNoShowFee, setSetupNoShowFee] = useState(NO_SHOW_FEE_EUR);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [paymentSetupError, setPaymentSetupError] = useState('');

  const times = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '12:30 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:30 PM', '05:30 PM'];
  const selectedServiceDetails = SERVICES.find(s => s.name === selectedService) || SERVICES[0];
  const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  const stripePromise = useMemo(() => stripePublishableKey ? loadStripe(stripePublishableKey) : null, [stripePublishableKey]);
  const elementsOptions = useMemo<StripeElementsOptions | undefined>(() => {
    if (!clientSecret) return undefined;
    return {
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#da4d73',
          borderRadius: '12px',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
        }
      }
    };
  }, [clientSecret]);

  useEffect(() => {
    if (!isOpen) return;
    if (!stripePublishableKey) {
      setPaymentSetupError('Falta configurar VITE_STRIPE_PUBLISHABLE_KEY.');
      return;
    }

    const controller = new AbortController();
    setIsPreparingPayment(true);
    setPaymentSetupError('');
    setClientSecret('');
    setSetupCustomerId('');

    invokeFunction<{
      clientSecret: string;
      customerId: string;
      serviceId: string;
      priceCents: number;
      noShowFeeCents: number;
    }>('create-setup-intent', {
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        service: selectedService,
        noShowFeeAmount: NO_SHOW_FEE_EUR * 100
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setClientSecret(payload.clientSecret);
        setSetupCustomerId(payload.customerId);
        setSetupServiceId(payload.serviceId);
        setSetupNoShowFee(Math.round((payload.noShowFeeCents || NO_SHOW_FEE_EUR * 100) / 100));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setPaymentSetupError(error.message);
      })
      .finally(() => setIsPreparingPayment(false));

    return () => controller.abort();
  }, [isOpen, selectedDate, selectedTime, selectedService, stripePublishableKey]);

  const completeBooking = async (setupIntentId: string, stripePaymentMethodId: string) => {
    const response = await invokeFunction<{ appointment: {
      id: string;
      client_name: string;
      client_email: string;
      service_name: string;
      appointment_time: string;
      appointment_date: string;
      status: Appointment['status'];
      price_cents: number;
      stripe_customer_id: string;
      stripe_payment_method_id: string;
      payment_guarantee_status: 'secured' | 'not_required' | 'charged' | 'charge_failed';
      no_show_fee_cents: number;
      no_show_charge_id?: string;
    } }>('complete-booking', {
      setupIntentId,
      serviceId: setupServiceId,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      noShowFeeAmount: NO_SHOW_FEE_EUR * 100
    });

    const savedAppointment = response.appointment;

    onBook({
      id: savedAppointment.id,
      clientName: savedAppointment.client_name,
      clientEmail: savedAppointment.client_email,
      service: savedAppointment.service_name,
      time: savedAppointment.appointment_time,
      date: savedAppointment.appointment_date,
      status: savedAppointment.status,
      price: Math.round(savedAppointment.price_cents / 100),
      stripeCustomerId: savedAppointment.stripe_customer_id || setupCustomerId,
      stripePaymentMethodId: savedAppointment.stripe_payment_method_id || stripePaymentMethodId,
      paymentGuaranteeStatus: savedAppointment.payment_guarantee_status,
      noShowFeeAmount: Math.round((savedAppointment.no_show_fee_cents || setupNoShowFee * 100) / 100),
      noShowChargeId: savedAppointment.no_show_charge_id
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setClientName('');
      setClientEmail('');
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <motion.div
            id="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-md z-0"
          />

          <motion.div
            id="booking-modal-card"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="relative w-full max-w-lg bg-[#fffbfb] backdrop-blur-2xl rounded-2xl shadow-2xl overflow-y-auto border border-rose-100 z-10 text-stone-800 my-auto max-h-[90vh]"
          >
            {isSuccess ? (
              <div className="p-12 text-center flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-transparent">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-[#da4d73] rounded-full flex items-center justify-center text-white mb-6 border border-rose-150 shadow-[0_0_15px_rgba(218,77,115,0.4)]">
                  <Check className="w-8 h-8 font-extrabold" />
                </motion.div>
                <h3 className="font-serif text-2xl text-stone-900 font-bold mb-2">Reserva solicitada con exito</h3>
                <p className="font-sans text-xs text-stone-650 max-w-sm leading-relaxed">
                  Tu tarjeta queda guardada de forma segura en Stripe como garantia. Hemos agendado tu cita de <span className="font-bold text-[#da4d73]">{selectedService}</span> para el <span className="font-bold text-stone-900">{selectedDate}</span> a las <span className="font-bold text-stone-900">{selectedTime}</span>.
                </p>
              </div>
            ) : (
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-serif text-2xl text-[#da4d73] flex items-center gap-2 font-bold">
                      <Sparkles className="w-6 h-6 text-[#da4d73] fill-[#da4d73]/20" />
                      Pedir Cita Online
                    </h3>
                    <p className="font-sans text-xs text-stone-500 mt-1">Reserva con tarjeta de garantia para proteger la agenda del salon.</p>
                  </div>
                  <button id="close-booking-btn" onClick={onClose} className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors text-stone-450 hover:text-stone-800 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <PaymentBookingForm
                  clientName={clientName}
                  clientEmail={clientEmail}
                  selectedService={selectedService}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  times={times}
                  isPreparingPayment={isPreparingPayment}
                  paymentSetupError={paymentSetupError}
                  stripePromise={stripePromise}
                  elementsOptions={elementsOptions}
                  clientSecret={clientSecret}
                  selectedPrice={selectedServiceDetails.price}
                  noShowFee={setupNoShowFee}
                  onClientNameChange={setClientName}
                  onClientEmailChange={setClientEmail}
                  onSelectedServiceChange={setSelectedService}
                  onSelectedDateChange={setSelectedDate}
                  onSelectedTimeChange={setSelectedTime}
                  onCancel={onClose}
                  onCompleteBooking={completeBooking}
                />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface PaymentBookingFormProps {
  clientName: string;
  clientEmail: string;
  selectedService: string;
  selectedDate: string;
  selectedTime: string;
  times: string[];
  isPreparingPayment: boolean;
  paymentSetupError: string;
  stripePromise: ReturnType<typeof loadStripe> | null;
  elementsOptions?: StripeElementsOptions;
  clientSecret: string;
  selectedPrice: number;
  noShowFee: number;
  onClientNameChange: (value: string) => void;
  onClientEmailChange: (value: string) => void;
  onSelectedServiceChange: (value: string) => void;
  onSelectedDateChange: (value: string) => void;
  onSelectedTimeChange: (value: string) => void;
  onCancel: () => void;
  onCompleteBooking: (setupIntentId: string, paymentMethodId: string) => Promise<void>;
}

function PaymentBookingForm(props: PaymentBookingFormProps) {
  if (!props.stripePromise || !props.clientSecret || !props.elementsOptions) {
    return <BookingFields {...props} paymentElement={null} isPaymentReady={false} />;
  }

  return (
    <Elements stripe={props.stripePromise} options={props.elementsOptions}>
      <StripeBookingFields {...props} />
    </Elements>
  );
}

function StripeBookingFields(props: PaymentBookingFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!stripe || !elements || !props.clientName.trim() || !props.clientEmail.trim()) return;

    setIsSubmitting(true);
    const result = await stripe.confirmSetup({
      elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: props.clientName.trim(),
            email: props.clientEmail.trim()
          }
        }
      },
      redirect: 'if_required'
    });
    setIsSubmitting(false);

    if (result.error) {
      setSubmitError(result.error.message || 'No se pudo validar la tarjeta.');
      return;
    }

    const paymentMethodId = typeof result.setupIntent?.payment_method === 'string'
      ? result.setupIntent.payment_method
      : result.setupIntent?.payment_method?.id;

    if (!paymentMethodId) {
      setSubmitError('Stripe no devolvio un metodo de pago reutilizable.');
      return;
    }

    const setupIntentId = result.setupIntent?.id;
    if (!setupIntentId) {
      setSubmitError('Stripe no devolvio el identificador de la garantia.');
      return;
    }

    setIsSubmitting(true);
    try {
      await props.onCompleteBooking(setupIntentId, paymentMethodId);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar la cita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BookingFields
      {...props}
      paymentElement={<PaymentElement options={{ layout: 'tabs' }} />}
      submitError={submitError}
      isPaymentReady={Boolean(stripe && elements)}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}

interface BookingFieldsProps extends PaymentBookingFormProps {
  paymentElement: React.ReactNode;
  submitError?: string;
  isPaymentReady: boolean;
  isSubmitting?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
}

function BookingFields({
  clientName,
  clientEmail,
  selectedService,
  selectedDate,
  selectedTime,
  times,
  isPreparingPayment,
  paymentSetupError,
  paymentElement,
  submitError,
  isPaymentReady,
  isSubmitting = false,
  selectedPrice,
  noShowFee,
  onClientNameChange,
  onClientEmailChange,
  onSelectedServiceChange,
  onSelectedDateChange,
  onSelectedTimeChange,
  onCancel,
  onSubmit
}: BookingFieldsProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <InputBlock label="Nombre Completo" icon={<User className="w-4 h-4" />}>
        <input id="input-client-name" type="text" required value={clientName} onChange={(e) => onClientNameChange(e.target.value)} placeholder="Ej. Carmen Soler" className="booking-input" />
      </InputBlock>

      <InputBlock label="Email" icon={<Mail className="w-4 h-4" />}>
        <input id="input-client-email" type="email" required value={clientEmail} onChange={(e) => onClientEmailChange(e.target.value)} placeholder="carmen@email.com" className="booking-input" />
      </InputBlock>

      <InputBlock label="Seleccionar Servicio" icon={<Scissors className="w-4 h-4" />}>
        <select id="select-service-booking" value={selectedService} onChange={(e) => onSelectedServiceChange(e.target.value)} className="booking-input appearance-none cursor-pointer">
          {SERVICES.map((s) => (
            <option key={s.id} value={s.name} className="bg-white text-stone-800 font-sans text-xs p-2">
              {s.name} - EUR {s.price} ({s.duration})
            </option>
          ))}
        </select>
      </InputBlock>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputBlock label="Fecha" icon={<Calendar className="w-4 h-4" />}>
          <input id="input-booking-date" type="date" required value={selectedDate} onChange={(e) => onSelectedDateChange(e.target.value)} className="booking-input [color-scheme:light]" />
        </InputBlock>
        <InputBlock label="Hora" icon={<Clock className="w-4 h-4" />}>
          <select id="select-booking-time" value={selectedTime} onChange={(e) => onSelectedTimeChange(e.target.value)} className="booking-input appearance-none cursor-pointer">
            {times.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </InputBlock>
      </div>

      <div className="bg-rose-50/40 rounded-xl p-4 border border-rose-100 text-stone-800">
        <h4 className="font-sans text-xs text-stone-800 uppercase tracking-wider mb-2 font-bold">Resumen de reserva</h4>
        <div className="space-y-1.5 text-xs text-stone-600 font-sans">
          <div className="flex justify-between gap-4"><span>Tratamiento:</span><span className="font-bold text-stone-800 text-right">{selectedService}</span></div>
          <div className="flex justify-between"><span>Precio estimado:</span><span className="font-bold text-[#da4d73]">EUR {selectedPrice}</span></div>
          <div className="flex justify-between"><span>Fecha y hora:</span><span className="font-mono text-stone-850 font-bold">{selectedDate} @ {selectedTime}</span></div>
          <div className="flex justify-between"><span>Penalizacion no-show:</span><span className="font-bold text-stone-800">EUR {noShowFee}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-rose-150 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#da4d73] shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-sans text-xs text-stone-800 uppercase tracking-wider font-bold">Tarjeta de garantia</h4>
            <p className="text-[11px] text-stone-500 leading-relaxed mt-1">
              No se cobra ahora. Si el cliente no asiste o incumple la politica de cancelacion, podras cobrar la penalizacion autorizada desde Stripe.
            </p>
          </div>
        </div>

        {isPreparingPayment && <StatusBox>Preparando pago seguro con Stripe...</StatusBox>}
        {paymentSetupError && <StatusBox danger>{paymentSetupError}</StatusBox>}
        {paymentElement}

        <label className="mt-3 flex items-start gap-2 text-[11px] text-stone-600 leading-relaxed">
          <input type="checkbox" required className="mt-0.5 accent-[#da4d73]" />
          <span>Autorizo guardar mi tarjeta en Stripe para esta reserva y cobrar la penalizacion de no-show indicada si corresponde.</span>
        </label>
      </div>

      {submitError && <StatusBox danger>{submitError}</StatusBox>}

      <div className="flex gap-3 pt-2">
        <button id="cancel-booking-btn" type="button" onClick={onCancel} className="flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-full border border-rose-150 hover:bg-rose-50 text-stone-600 transition-colors cursor-pointer bg-white">
          Cancelar
        </button>
        <button id="submit-booking-btn" type="submit" disabled={!isPaymentReady || isPreparingPayment || isSubmitting || Boolean(paymentSetupError)} className="flex-1 bg-[#da4d73] text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-500/20 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="inline-flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            {isSubmitting ? 'Validando...' : 'Confirmar Reserva'}
          </span>
        </button>
      </div>
    </form>
  );
}

function InputBlock({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-sans text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">{icon}</div>
        {children}
      </div>
    </div>
  );
}

function StatusBox({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`text-xs rounded-xl p-3 flex gap-2 ${danger ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-stone-500 bg-rose-50/50 border border-rose-100'}`}>
      {danger && <AlertCircle className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}
