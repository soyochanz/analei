# Booking System

Sistema reutilizable de reservas, admin, POS, Stripe, Supabase, newsletter y WhatsApp.

## Estructura

```txt
packages/booking-core
packages/booking-react
booking-system/supabase
```

`booking-core` contiene tipos, adaptadores y API cliente.

`booking-react` contiene componentes React reutilizables:

```tsx
import { BookingModal, DashboardView } from '@booking-system/react';
```

`booking-system/supabase` contiene una copia exportable de migraciones y Edge Functions.

## Variables Frontend

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
```

## Variables Supabase Edge Functions

```txt
STRIPE_SECRET_KEY=
RESEND_API_KEY=
NEWSLETTER_FROM_EMAIL=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_CONFIRMATION=
WHATSAPP_TEMPLATE_REMINDER=
WHATSAPP_TEMPLATE_LANGUAGE=es
```

## Instalacion En Otra Web

1. Copia `packages/booking-core` y `packages/booking-react`.
2. Copia `booking-system/supabase` o el directorio `supabase`.
3. Aplica migraciones en tu proyecto Supabase.
4. Despliega las Edge Functions.
5. Configura las variables de entorno frontend y secrets de Supabase.
6. Importa los componentes React o usa solo `createBookingApi` desde core.

## Uso Core

```ts
import { createBookingApi, createBookingClient } from '@booking-system/core';

const client = createBookingClient({
  supabaseUrl: 'https://PROJECT.supabase.co',
  supabaseAnonKey: 'PUBLIC_KEY'
});

const bookingApi = createBookingApi(client);
const appointments = await bookingApi.listAppointments();
```

## Uso React

```tsx
import { BookingModal } from '@booking-system/react';
```

El componente usa las variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_STRIPE_PUBLISHABLE_KEY`.

## Notas

- WhatsApp requiere Meta WhatsApp Cloud API y plantillas aprobadas.
- Stripe requiere publishable key en frontend y secret key en Supabase.
- Los recordatorios WhatsApp dependen de Supabase Cron.
