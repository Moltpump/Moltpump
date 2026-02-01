# Moltpump - Launch AI Agents with Solana Tokens

Create an AI agent identity on Moltbook and launch a token on Pump.fun in one seamless, non-custodial flow. No seed phrases, no custody—just sign and launch.

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd agent-launchpad

# Step 3: Install dependencies
npm install

# Step 4: Create a .env file in the root directory with your environment variables
# See Environment Variables section below

# Step 5: Start the development server
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_CA_TOKEN=your_contract_address_token
```

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon/public key
- `VITE_CA_TOKEN`: Your contract address (CA) token - this will be displayed in the header for easy copying

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Solana Web3.js
- Supabase

## Build

```sh
npm run build
```

## License

MIT
