This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Email schedule reminders

The Schedule panel stores verified reminder schedules in Upstash Redis, uses Upstash QStash for the user's selected daily time, and sends email through Resend.

Configure these server-side environment variables in Vercel:

```text
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
QSTASH_TOKEN=
RESEND_API_KEY=
REMINDER_FROM_EMAIL=Dream Realizer <reminders@your-verified-domain.com>
```

`REMINDER_FROM_EMAIL` must use a domain verified in Resend. Reminder schedules remain inactive until the recipient clicks the confirmation link sent to their email.

### Authentication and Stripe subscriptions

The temporary authentication system stores users, password hashes, sessions, Stripe customer IDs, and subscription status in Upstash Redis. Passwords are hashed with Node.js `scrypt`; browser sessions use a 30-day `httpOnly` cookie.

Add these server-side values to `.env.local` and to the Vercel project:

```text
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In Stripe:

1. Create a recurring Pro product and copy its `price_...` ID to `STRIPE_PRO_PRICE_ID`.
2. Enable the Stripe customer portal.
3. Create a webhook endpoint for `/api/stripe/webhook`.
4. Subscribe the webhook to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.

For local webhook testing with the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the CLI's `whsec_...` signing secret to `STRIPE_WEBHOOK_SECRET`. Use Stripe test card `4242 4242 4242 4242` with any future expiry and CVC.

Redis keys created by this implementation:

```text
auth:user:<email>
auth:session:<sha256-session-token>
auth:stripe-customer:<stripe-customer-id>
```
