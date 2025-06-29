## Blendify: Stellar DeFi Hub

A modern DeFi application built on Stellar, featuring a beautiful Blendify-branded UI, wallet connection via Freighter, and Soroban smart contract integration.

## 🚀 Features

- *Modern UI:* Blendify color palette, Inter font, and responsive design
- *Freighter Wallet Integration:* Secure wallet connection and transaction signing using official @stellar/freighter-api
- *DeFi Operations UI:* Tabs for Swapping, Borrowing, and Staking with modern styling
- *Portfolio Dashboard:* Health factor monitoring, rewards tracking, and position management
- *Multi-Asset Support:* XLM, USDC, BLND, WETH, WBTC with testnet addresses
- *Advanced Styling:* Custom Blendify components, gradients, and improved typography

> *Note:*  
> The UI for Swap, Borrow, and Stake is complete with modern styling, but the backend contract call logic is not yet implemented.  
> Buttons currently show placeholder alerts. See src/components/DeFiTabs.tsx for where to add contract logic.

## 🛠 Getting Started

1. *Clone the repository:*
   bash
   git clone https://github.com/kootie/blendifi.git
   cd blendifi
   

2. *Install dependencies:*
   bash
   npm install
   

3. *Set your contract address:*
   - Open src/lib/blendClient.ts
   - Deployed contract ID ( CA26SDP73CGMH5E5HHTHT3DN4YPH4DJUNRBRHPB4ZJTF2DQXDMCXXTZH)

4. *Start the development server:*
   bash
   npm run dev
   
   - App runs at [http://localhost:8080](http://localhost:8080)

## 💡 Usage

### Connecting Wallet
1. Click "Connect Wallet" button
2. Approve the connection in Freighter (make sure it's set to Testnet)
3. Your wallet address and network information will be displayed

### DeFi Operations (UI Ready, Backend Pending)
- *Swap:* Select tokens and amounts 
- *Borrow:* Choose assets to borrow against collateral 
- *Stake:* Stake BLND tokens for rewards 

### Portfolio Features
- *Health Factor:* Real-time monitoring with color-coded status
- *Balances:* View your token balances in a clean, organized layout
- *Supplied/Borrowed Assets:* Track your DeFi positions

## 🎨 UI/UX Highlights

- *Blendify Brand Colors:* Blue (#0066ff), Teal (#00b3b3), Purple (#6366f1)
- *Modern Typography:* Inter font family for improved readability
- *Responsive Design:* Works seamlessly on desktop and mobile
- *Custom Components:* Blendify-specific buttons, cards, and form elements
- *Smooth Animations:* Hover effects and transitions for better user experience

## 🧑‍💻 Development

### Tech Stack
- *Frontend:* React 18, TypeScript, Vite
- *Styling:* Tailwind CSS, custom CSS with CSS variables
- *UI Components:* Shadcn/ui with custom Blendify styling
- *Wallet Integration:* @stellar/freighter-api (official)
- *Blockchain:* stellar-sdk (latest), soroban-client

### Key Components
- App.tsx: Main application with modern layout and features grid
- WalletConnect.tsx: Freighter wallet connection with status indicators
- DeFiTabs.tsx: Swap, Borrow, and Stake interface (UI complete)
- Dashboard.tsx: Portfolio analytics and position tracking
- index.css: Blendify color scheme and custom component styles

### Project Structure

src/
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   ├── WalletConnect.tsx
│   ├── DeFiTabs.tsx
│   ├── Dashboard.tsx
│   ├── TokenSelector.tsx
│   └── TxButton.tsx
├── hooks/              # Custom React hooks
│   └── useFreighter.tsx
├── lib/                # Utility functions
│   ├── blendClient.ts  # Contract configuration
│   └── utils.ts
├── App.tsx             # Main app entry
├── index.css           # Tailwind and Blendify styles
└── main.tsx           # Application entry point


## 📦 Available Scripts

- npm run dev - Start development server
- npm run build - Build for production
- npm run preview - Preview production build
- npm run lint - Run ESLint

## 🔧 Configuration

### Environment Setup
- Ensure Freighter wallet is installed and set to Testnet
- Contract address is configured in src/lib/blendClient.ts
- All styling is handled through Tailwind CSS and custom CSS variables

### Smart Contract Integration
The smart contract is deployed at CA26SDP73CGMH5E5HHTHT3DN4YPH4DJUNRBRHPB4ZJTF2DQXDMCXXTZH and supports:
- Token swapping with fixed exchange rates
- Asset borrowing with health factor monitoring
- BLND token staking with rewards
- Liquidation protection features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the UI and functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- *Repository:* [https://github.com/kootie/blendifi.git](https://github.com/kootie/blendifi.git)
- *Live Demo:* [blendifi.vercel.app](https://blendifi.vercel.app)
- *Smart Contract:* Deployed on Stellar Testnet

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the smart contract documentation
- Open an issue on GitHub

---

*Built with ❤ for the Stellar ecosystem*
