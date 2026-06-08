# Supabase Backend

Incluye:

- Migraciones SQL para citas, servicios, productos, staff, POS, clientes, newsletter, blog, Stripe no-show y WhatsApp.
- Edge Functions:
  - `create-setup-intent`
  - `complete-booking`
  - `charge-no-show`
  - `list-appointments`
  - `admin-panel`
  - `send-whatsapp-reminders`

## Despliegue

```powershell
$env:SUPABASE_ACCESS_TOKEN='TU_TOKEN'
npx supabase db push --linked --yes
npx supabase functions deploy create-setup-intent --project-ref TU_PROJECT_REF --no-verify-jwt
npx supabase functions deploy complete-booking --project-ref TU_PROJECT_REF --no-verify-jwt
npx supabase functions deploy charge-no-show --project-ref TU_PROJECT_REF --no-verify-jwt
npx supabase functions deploy list-appointments --project-ref TU_PROJECT_REF --no-verify-jwt
npx supabase functions deploy admin-panel --project-ref TU_PROJECT_REF --no-verify-jwt
npx supabase functions deploy send-whatsapp-reminders --project-ref TU_PROJECT_REF --no-verify-jwt
```

En otro proyecto hay que cambiar la URL hardcodeada del cron de WhatsApp en la migracion `whatsapp_notifications` para que apunte al nuevo `PROJECT_REF`.
