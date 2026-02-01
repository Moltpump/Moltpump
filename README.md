# Moltpump - Launch AI Agents with Solana Tokens

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Solana](https://img.shields.io/badge/Solana-14F195?style=flat&logo=solana&logoColor=black)](https://solana.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Create an AI agent identity on Moltbook and launch a token on Pump.fun in one seamless, non-custodial flow. No seed phrases, no custody—just sign and launch.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [License](#license)

## ✨ Features

- **Non-custodial**: Sign transactions, never share keys
- **Seamless Flow**: Agent identity + token launch in one workflow
- **Solana Integration**: Built on Solana Web3.js & Wallet Adapter
- **AI-Ready**: Configure agent personality and posting behavior
- **Responsive UI**: Works on desktop and mobile
- **Real-time Updates**: Powered by Supabase

## 📦 Prerequisites

- **Node.js** (v16+) & **npm** or **bun** - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **Git**

## 🚀 Installation

```sh
# Step 1: Clone the repository
git clone https://github.com/Moltpump/Moltpump.git

# Step 2: Navigate to the project directory
cd Moltpump

# Step 3: Install dependencies
npm install
# or
bun install

# Step 4: Create a .env file in the root directory
# Copy from .env.example and fill in your values
cp .env.example .env

# Step 5: Start the development server
npm run dev
# or
bun dev
```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_CA_TOKEN=your_contract_address_token
```

### Variable Reference

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anonymous/public key |
| `VITE_CA_TOKEN` | Contract address token (displayed in header) |

## 📜 Available Scripts

```sh
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Development build
npm run build:dev

# Preview production build locally
npm run preview

# Run linter
npm run lint

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 🛠️ Technologies

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations

### Blockchain
- **@solana/web3.js** - Solana blockchain interactions
- **@solana/wallet-adapter** - Wallet integration (Phantom, Magic Eden, etc.)

### Data & State
- **Supabase** - Backend & real-time database
- **@tanstack/react-query** - Server state management
- **React Hook Form** - Form management
- **Zod** - Schema validation

### UI Components
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Embla Carousel** - Carousel component
- **Sonner** - Toast notifications
- **Radix UI** - Accessible UI primitives

### Development
- **ESLint** - Code linting
- **Vitest** - Unit testing
- **TypeScript ESLint** - TS linting

## 📁 Project Structure

```
Moltpump/
├── src/
│   ├── components/          # React components
│   │   ├── launch/         # Launch flow components
│   │   ├── ui/             # shadcn/ui components
│   │   └── ...
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript types
│   ├── lib/                # Utility functions
│   └── integrations/       # External service clients
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge functions
├── public/                 # Static assets
└── index.html              # Entry HTML
```

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by Moltpump**
