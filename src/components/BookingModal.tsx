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
import { loadStripe, SetupIntentResult, StripeElementsOptions } from '@stripe/stripe-js';
import { invokeFunction } from '../lib/supabase';
import { Appointment, Service } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stylists: { id: string; name: string }[];
  services: Service[];
  settings?: { opening_time?: string; closing_time?: string };
  appointments: Appointment[];
  onBook: (appointment: Omit<Appointment, 'clientInitials' | 'avatarColor'>) => void;
}

const NO_SHOW_FEE_EUR = 40;
const todayIso = () => new Date().toISOString().slice(0, 10);
const toMinutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};
const buildTimeSlots = (opening: string, closing: string) => {
  const start = toMinutes(opening);
  const end = toMinutes(closing);
  const slots: string[] = [];
  for (let current = start; current <= end - 30; current += 30) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }
  return slots;
};

export default function BookingModal({ isOpen, onClose, stylists, services, settings, appointments, onBook }: BookingModalProps) {
  const serviceOptions = services.length ? services : [];
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedService, setSelectedService] = useState(serviceOptions[0]?.name || '');
  const [selectedStylistId, setSelectedStylistId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedTime, setSelectedTime] = useState('11:00');
  const [isSuccess, setIsSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [setupCustomerId, setSetupCustomerId] = useState('');
  const [setupServiceId, setSetupServiceId] = useState('');
  const [setupNoShowFee, setSetupNoShowFee] = useState(NO_SHOW_FEE_EUR);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [paymentSetupError, setPaymentSetupError] = useState('');
  const [paymentSetupKey, setPaymentSetupKey] = useState('');

  const times = buildTimeSlots(settings?.opening_time || '09:00', settings?.closing_time || '20:30');
  const selectedServiceDetails = serviceOptions.find(s => s.name === selectedService) || serviceOptions[0];
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
    if (!selectedService && serviceOptions[0]) setSelectedService(serviceOptions[0].name);
    const setupServiceName = selectedService || serviceOptions[0]?.name;
    if (!setupServiceName) return;
    setPaymentSetupKey(`${Date.now()}-${setupServiceName}`);

    invokeFunction<{
      clientSecret: string;
      customerId: string;
      serviceId: string;
      priceCents: number;
      noShowFeeCents: number;
    }>('create-setup-intent', {
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        service: setupServiceName,
        stylistId: '',
        noShowFeeAmount: NO_SHOW_FEE_EUR * 100
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setClientSecret(payload.clientSecret);
        setSetupCustomerId(payload.customerId);
        setSetupServiceId(payload.serviceId);
        setSetupNoShowFee(Math.round((payload.noShowFeeCents ?? NO_SHOW_FEE_EUR * 100) / 100));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setPaymentSetupError(error.message);
      })
      .finally(() => setIsPreparingPayment(false));

    return () => controller.abort();
  }, [isOpen, stripePublishableKey, serviceOptions[0]?.id]);

  const completeBooking = async (setupIntentId: string, stripePaymentMethodId: string) => {
    const currentServiceId = serviceOptions.find(s => s.name === selectedService)?.id || setupServiceId;
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
      serviceId: currentServiceId,
      stylistId: selectedStylistId,
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
      stylistId: selectedStylistId || undefined,
      stylistName: stylists.find(s => s.id === selectedStylistId)?.name,
      time: savedAppointment.appointment_time,
      date: savedAppointment.appointment_date,
      status: savedAppointment.status,
      price: Math.round(savedAppointment.price_cents / 100),
      stripeCustomerId: savedAppointment.stripe_customer_id || setupCustomerId,
      stripePaymentMethodId: savedAppointment.stripe_payment_method_id || stripePaymentMethodId,
      paymentGuaranteeStatus: savedAppointment.payment_guarantee_status,
      noShowFeeAmount: Math.round((savedAppointment.no_show_fee_cents ?? setupNoShowFee * 100) / 100),
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
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-3 sm:p-6">
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
            className="relative my-auto w-full max-w-[1120px] overflow-hidden rounded-[2rem] border border-white/70 bg-[#fffafa] text-stone-800 shadow-[0_30px_90px_rgba(41,37,36,0.25)] backdrop-blur-2xl"
            style={{ maxHeight: '92vh' }}
          >
            {isSuccess ? (
              <div className="p-12 text-center flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-transparent">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-[#da4d73] rounded-full flex items-center justify-center text-white mb-6 border border-rose-150 shadow-[0_0_15px_rgba(218,77,115,0.4)]">
                  <Check className="w-8 h-8 font-extrabold" />
                </motion.div>
                <h3 className="font-serif text-2xl text-stone-900 font-bold mb-2">Reserva solicitada con exito</h3>
                <p className="font-sans text-xs text-stone-650 max-w-sm leading-relaxed">
                  Tu tarjeta queda guardada de forma segura como garantia. Hemos agendado tu cita de <span className="font-bold text-[#da4d73]">{selectedService}</span> para el <span className="font-bold text-stone-900">{selectedDate}</span> a las <span className="font-bold text-stone-900">{selectedTime}</span>.
                </p>
              </div>
            ) : (
              <div className="max-h-[92vh] overflow-y-auto">
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-rose-100/80 bg-[#fffafa]/95 px-6 py-5 backdrop-blur-xl md:px-9">
                  <div>
                    <h3 className="font-serif text-3xl text-[#c83f67] flex items-center gap-3 font-bold">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-100 bg-white shadow-sm">
                        <Sparkles className="w-5 h-5 text-[#da4d73] fill-[#da4d73]/20" />
                      </span>
                      Pedir Cita Online
                    </h3>
                    <p className="font-sans text-sm text-stone-500 mt-2">Reserva con tarjeta de garantia para proteger la agenda del salon.</p>
                  </div>
                  <button id="close-booking-btn" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full border border-rose-100 bg-white text-stone-500 shadow-sm transition-colors hover:bg-rose-50 hover:text-stone-900 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 md:p-9">
                  <PaymentBookingForm
                    clientName={clientName}
                    clientEmail={clientEmail}
                    selectedService={selectedService}
                    selectedStylistId={selectedStylistId}
                    stylists={stylists}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    times={times}
                    services={serviceOptions}
                    openingTime={settings?.opening_time || '09:00'}
                    closingTime={settings?.closing_time || '20:30'}
                    appointments={appointments}
                    isPreparingPayment={isPreparingPayment}
                    paymentSetupError={paymentSetupError}
                    stripePromise={stripePromise}
                    elementsOptions={elementsOptions}
                  clientSecret={clientSecret}
                  paymentSetupKey={paymentSetupKey}
                    selectedPrice={selectedServiceDetails?.price || 0}
                    noShowFee={setupNoShowFee}
                    onClientNameChange={setClientName}
                    onClientEmailChange={setClientEmail}
                    onSelectedServiceChange={setSelectedService}
                    onSelectedStylistChange={setSelectedStylistId}
                    onSelectedDateChange={setSelectedDate}
                    onSelectedTimeChange={setSelectedTime}
                    onCancel={onClose}
                    onCompleteBooking={completeBooking}
                  />
                </div>
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
  selectedStylistId: string;
  stylists: { id: string; name: string }[];
  selectedDate: string;
  selectedTime: string;
  times: string[];
  services: Service[];
  openingTime: string;
  closingTime: string;
  appointments: Appointment[];
  isPreparingPayment: boolean;
  paymentSetupError: string;
  stripePromise: ReturnType<typeof loadStripe> | null;
  elementsOptions?: StripeElementsOptions;
  clientSecret: string;
  paymentSetupKey: string;
  selectedPrice: number;
  noShowFee: number;
  onClientNameChange: (value: string) => void;
  onClientEmailChange: (value: string) => void;
  onSelectedServiceChange: (value: string) => void;
  onSelectedStylistChange: (value: string) => void;
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
    <Elements key={props.paymentSetupKey || props.clientSecret} stripe={props.stripePromise} options={props.elementsOptions}>
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
    let result: SetupIntentResult;
    try {
      result = await stripe.confirmSetup({
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
    } catch (error) {
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : 'No se pudo validar la tarjeta.');
      return;
    }
    setIsSubmitting(false);

    if (result.error) {
      setSubmitError(result.error.message || 'No se pudo validar la tarjeta.');
      return;
    }

    const paymentMethodId = typeof result.setupIntent?.payment_method === 'string'
      ? result.setupIntent.payment_method
      : result.setupIntent?.payment_method?.id;

    if (!paymentMethodId) {
      setSubmitError('No se pudo preparar un metodo de pago reutilizable.');
      return;
    }

    const setupIntentId = result.setupIntent?.id;
    if (!setupIntentId) {
      setSubmitError('No se pudo preparar el identificador de la garantia.');
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
      paymentElement={
        <div className="stripe-compact-element">
          <PaymentElement
            options={{
              layout: 'accordion',
              defaultValues: {
                billingDetails: {
                  name: props.clientName,
                  email: props.clientEmail
                }
              },
              fields: {
                billingDetails: {
                  name: 'never',
                  email: 'never',
                  address: 'never'
                }
              },
              terms: {
                card: 'never'
              },
              wallets: {
                applePay: 'never',
                googlePay: 'never'
              }
            }}
          />
        </div>
      }
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
  selectedStylistId,
  stylists,
  selectedDate,
  selectedTime,
  times,
  services,
  openingTime,
  closingTime,
  appointments,
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
  onSelectedStylistChange,
  onSelectedDateChange,
  onSelectedTimeChange,
  onCancel,
  onSubmit
}: BookingFieldsProps) {
  const dateOptions = Array.from({ length: 10 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() + index);
    return day.toISOString().slice(0, 10);
  });
  const activeStylistsCount = Math.max(1, stylists.length);
  const occupiedCountForSlot = (date: string, time: string) => {
    const sameSlot = appointments.filter(ap => ap.date === date && ap.time === time && ap.status !== 'Cancelled');
    if (!selectedStylistId) return sameSlot.length;
    return sameSlot.some(ap => ap.stylistId === selectedStylistId) ? activeStylistsCount : 0;
  };
  const availabilityForDate = (date: string) => {
    const day = new Date(date).getDay();
    if (day === 0) return 'closed';
    const slotStates = times.map(time => {
      const occupied = occupiedCountForSlot(date, time);
      if (occupied >= activeStylistsCount) return 'closed';
      if (occupied >= Math.ceil(activeStylistsCount / 2)) return 'limited';
      return 'available';
    });
    const closedSlots = slotStates.filter(state => state === 'closed').length;
    const pressuredSlots = slotStates.filter(state => state !== 'available').length;
    if (closedSlots >= times.length) return 'closed';
    if (pressuredSlots >= Math.ceil(times.length / 2)) return 'limited';
    return 'available';
  };
  const availabilityForTime = (time: string) => {
    const minutes = toMinutes(time);
    const opening = toMinutes(openingTime);
    const closing = toMinutes(closingTime);
    if (minutes < opening || minutes >= closing) return 'closed';
    const occupied = occupiedCountForSlot(selectedDate, time);
    if (occupied >= activeStylistsCount) return 'closed';
    if (occupied >= Math.ceil(activeStylistsCount / 2)) return 'limited';
    return 'available';
  };
  const availabilityClass = (state: string, active: boolean) =>
    active ? 'border-stone-900 bg-stone-900 text-white' :
    state === 'available' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
    state === 'limited' ? 'border-amber-200 bg-amber-50 text-amber-800' :
    'border-rose-200 bg-rose-50 text-rose-700 opacity-60';

  return (
    <form onSubmit={onSubmit} className="grid gap-7 xl:grid-cols-[minmax(340px,0.9fr)_minmax(540px,1.1fr)]">
      <div className="space-y-5 rounded-[1.5rem] border border-rose-100 bg-white/80 p-5 shadow-sm md:p-6">
      <div>
        <p className="font-serif text-xl font-bold text-stone-900">Tus datos</p>
        <p className="mt-1 text-sm text-stone-500">Elige servicio, profesional y deja preparada la reserva.</p>
      </div>

      <InputBlock label="Nombre Completo" icon={<User className="w-5 h-5" />}>
        <input id="input-client-name" type="text" required value={clientName} onChange={(e) => onClientNameChange(e.target.value)} placeholder="Ej. Carmen Soler" className="booking-input" />
      </InputBlock>

      <InputBlock label="Email" icon={<Mail className="w-5 h-5" />}>
        <input id="input-client-email" type="email" required value={clientEmail} onChange={(e) => onClientEmailChange(e.target.value)} placeholder="carmen@email.com" className="booking-input" />
      </InputBlock>

      <InputBlock label="Seleccionar Servicio" icon={<Scissors className="w-5 h-5" />}>
        <select id="select-service-booking" value={selectedService} onChange={(e) => onSelectedServiceChange(e.target.value)} className="booking-input appearance-none cursor-pointer">
          {services.map((s) => (
            <option key={s.id} value={s.name} className="bg-white text-stone-800 font-sans text-xs p-2">
              {s.name} - EUR {s.price} ({s.duration})
            </option>
          ))}
        </select>
      </InputBlock>

      <InputBlock label="Peluquero/a" icon={<User className="w-5 h-5" />}>
        <select value={selectedStylistId} onChange={(e) => onSelectedStylistChange(e.target.value)} className="booking-input appearance-none cursor-pointer">
          <option value="">Cualquiera disponible</option>
          {stylists.map(stylist => <option key={stylist.id} value={stylist.id}>{stylist.name}</option>)}
        </select>
      </InputBlock>

      </div>

      <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-rose-100 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <label className="font-sans text-xs uppercase tracking-wider text-stone-500 font-bold">Fechas disponibles</label>
            <p className="mt-1 text-xs text-stone-400">Verde disponible, amarillo poca disponibilidad.</p>
          </div>
          <div className="flex gap-3 text-[11px] font-bold"><span className="text-emerald-700">Disponible</span><span className="text-amber-700">Poca</span><span className="text-rose-700">No</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {dateOptions.map(date => {
            const state = availabilityForDate(date);
            return <button type="button" key={date} disabled={state === 'closed'} onClick={() => onSelectedDateChange(date)} className={`min-h-16 rounded-2xl border px-3 text-sm font-black transition-transform hover:-translate-y-0.5 disabled:hover:translate-y-0 ${availabilityClass(state, selectedDate === date)}`}>{new Date(date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</button>;
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <InputBlock label="Fecha" icon={<Calendar className="w-4 h-4" />}>
          <input id="input-booking-date" type="date" required value={selectedDate} onChange={(e) => onSelectedDateChange(e.target.value)} className="booking-input [color-scheme:light]" />
        </InputBlock>
        <div className="rounded-[1.5rem] border border-rose-100 bg-white p-5 shadow-sm">
          <label className="mb-3 block font-sans text-xs uppercase tracking-wider text-stone-500 font-bold">Horas disponibles</label>
          <div className="grid max-h-64 grid-cols-3 gap-3 overflow-auto pr-1 sm:grid-cols-4">
            {times.map(t => {
              const state = availabilityForTime(t);
              return <button type="button" key={t} disabled={state === 'closed'} onClick={() => onSelectedTimeChange(t)} className={`min-h-12 rounded-2xl border text-sm font-black transition-transform hover:-translate-y-0.5 disabled:hover:translate-y-0 ${availabilityClass(state, selectedTime === t)}`}>{t}</button>;
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-5 text-stone-800 shadow-sm">
        <h4 className="font-sans text-xs text-stone-800 uppercase tracking-wider mb-2 font-bold">Resumen de reserva</h4>
        <div className="space-y-2 text-sm text-stone-600 font-sans">
          <div className="flex justify-between gap-4"><span>Tratamiento:</span><span className="font-bold text-stone-800 text-right">{selectedService}</span></div>
          <div className="flex justify-between"><span>Precio estimado:</span><span className="font-bold text-[#da4d73]">EUR {selectedPrice}</span></div>
          <div className="flex justify-between"><span>Fecha y hora:</span><span className="font-mono text-stone-850 font-bold">{selectedDate} @ {selectedTime}</span></div>
          <div className="flex justify-between"><span>Penalizacion no-show:</span><span className="font-bold text-stone-800">EUR {noShowFee}</span></div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#da4d73] shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-sans text-sm text-stone-800 uppercase tracking-wider font-bold">Tarjeta de garantia</h4>
            <p className="text-xs text-stone-500 leading-relaxed mt-1">
              No se cobra ahora. Solo se guarda la tarjeta para aplicar la politica de no-show si corresponde.
            </p>
          </div>
        </div>

        {isPreparingPayment && <StatusBox>Preparando pago seguro...</StatusBox>}
        {paymentSetupError && <StatusBox danger>{paymentSetupError}</StatusBox>}
        {paymentElement}

        <label className="mt-3 flex items-start gap-3 rounded-2xl bg-stone-50 p-3 text-xs text-stone-600 leading-relaxed">
          <input type="checkbox" required className="mt-0.5 accent-[#da4d73]" />
          <span>Autorizo guardar mi tarjeta para esta reserva y cobrar la penalizacion de no-show indicada si corresponde.</span>
        </label>
      </div>

      {submitError && <StatusBox danger>{submitError}</StatusBox>}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <button id="cancel-booking-btn" type="button" onClick={onCancel} className="flex-1 py-4 text-sm font-bold uppercase tracking-wider rounded-full border border-rose-150 hover:bg-rose-50 text-stone-600 transition-colors cursor-pointer bg-white">
          Cancelar
        </button>
        <button id="submit-booking-btn" type="submit" disabled={!isPaymentReady || isPreparingPayment || isSubmitting || Boolean(paymentSetupError)} className="flex-1 bg-[#da4d73] text-white py-4 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-500/20 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="inline-flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            {isSubmitting ? 'Validando...' : 'Confirmar Reserva'}
          </span>
        </button>
      </div>
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
