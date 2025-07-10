# Riftwallet Chrome Extension

A secure multi-chain cryptocurrency wallet Chrome extension that supports Ethereum, Solana, Kadena and other blockchain networks.

## Features

- 🔐 **Secure Wallet Management**: Create, import, and manage multiple wallets
- 🌐 **Multi-Chain Support**: ETH, BSC, MATIC, ARB, OP, AVAX, BASE, ZKSYNC, LINEA, MANTA, FTM, CRO, SOL, KDA
- 💰 **Asset Management**: View balances, token prices, and portfolio overview
- 🔄 **Token Transfer**: Send and receive cryptocurrencies across supported networks
- 🔀 **Token Swap**: Built-in DEX integration for Solana tokens
- 🔒 **Security Features**: Password protection, encrypted storage, secure key management
- 🌍 **Web3 Integration**: Connect to DApps with injected provider
- 🎨 **Modern UI**: Clean, responsive interface built with Vue.js

## Architecture

### Core Components

- **Background Script**: Service worker handling API calls and data management
- **Popup Interface**: Main user interface for wallet operations
- **Content Script**: Web3 provider injection for DApp integration
- **Options Page**: Advanced settings and configuration

### Technology Stack

- **Frontend**: Vue.js 3 + TypeScript + Vite
- **UI Library**: Element Plus
- **State Management**: Pinia
- **Styling**: Tailwind CSS + SCSS
- **Build Tool**: Vite
- **Crypto Libraries**: ethers.js, @solana/web3.js, crypto-js

## Project Structure

```
frontend/
├── public/
│   ├── icons/                    # Extension icons
│   └── manifest.json             # Chrome extension manifest
├── src/
│   ├── background/               # Background script (Service Worker)
│   ├── content/                  # Content scripts for Web3 injection
│   ├── popup/                    # Main popup interface
│   ├── options/                  # Settings page
│   ├── shared/                   # Shared utilities and types
│   │   ├── api/                  # API integration
│   │   ├── types/                # TypeScript definitions
│   │   ├── utils/                # Utility functions
│   │   ├── constants/            # App constants
│   │   └── stores/               # Pinia state management
│   └── assets/                   # Static assets
├── docs/                         # Documentation
├── tests/                        # Test files
└── scripts/                      # Build scripts
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Chrome browser for testing

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd frontend

# Install dependencies
npm install
```

### Development Mode

```bash
# Start development build with watch mode
npm run dev

# The extension will be built to the 'dist' directory
# Load the 'dist' directory as an unpacked extension in Chrome
```

### Building for Production

```bash
# Build for production
npm run build

# The built extension will be in the 'dist' directory
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist` directory
4. The CocoWallet extension should now appear in your extensions

### Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

## API Integration

The extension integrates with the CocoWallet backend API running at `http://192.168.3.56:8000/api/v1/`.

### Key API Endpoints

- **Wallet Management**: Create, import, delete wallets
- **Balance Queries**: Get wallet balances and token prices
- **Transfers**: Send transactions across supported chains
- **Token Swaps**: Solana token exchange via integrated DEX
- **Security**: Payment password management and authentication

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## Security Features

### Data Protection
- Private keys encrypted with user password
- Secure storage using Chrome Storage API
- No sensitive data transmitted in plain text

### Authentication
- Payment password required for sensitive operations
- Device-based authentication with unique device IDs
- Session management with auto-lock functionality

### Web3 Security
- Secure provider injection for DApp interaction
- Transaction confirmation prompts
- Permission-based access control

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

## Roadmap

- [ ] NFT support and management
- [ ] Hardware wallet integration
- [ ] Multi-signature wallet support
- [ ] DeFi protocol integrations
- [ ] Cross-chain bridge functionality
- [ ] Mobile app companion

---

Built with ❤️ by the CocoWallet Team
