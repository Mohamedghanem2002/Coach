# Player Management Dashboard

A Next.js dashboard for managing players and branches with MongoDB-backed authentication.

## Requirements

- Node.js 20.9 or newer
- A MongoDB database

## Local setup

Install dependencies with `npm ci`, then copy `.env.example` to `.env.local` and
fill in the MongoDB values and a long random `AUTH_SECRET`. Never commit
`.env.local` or put real credentials in `.env.example`.

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

## Account login

The dashboard and its API routes require an account. From the sign-in page you can
create an account with a name, email, and password of at least eight characters,
then use the logout button in the dashboard to end the session.

Copy `.env.example` to `.env.local` and fill in `AUTH_SECRET` alongside the existing
MongoDB values.

Open [http://localhost:3000](http://localhost:3000). Create an account from the
sign-in page, then manage players and branches from the dashboard.

## Production checks

```bash
npm run lint
npm run build
```

## GitHub and deployment

Push the repository to GitHub without committing `.env.local`, `node_modules`,
or `.next`. Configure `MONGODB_URI`, `MONGODB_DB`, and `AUTH_SECRET` as secrets
or environment variables in the deployment provider, then use `npm run build`
and `npm run start`.

GitHub Actions runs lint and build checks for pushes and pull requests.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
