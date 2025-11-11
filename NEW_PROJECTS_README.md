# FDC-101 New Projects Implementation

This document details the new on-chain projects added to the FDC-101 codebase: a Crypto Price Feed Lending Protocol and a Commodity Supply Chain Tracker, both integrated with Flare Data Connector (FDC) attestations.

## Overview of Changes

The FDC-101 codebase has been extended with two new decentralized applications that leverage FDC for bringing external Web2 data onto the Flare blockchain:

1. **Price Feed Lending Protocol** - A lending platform using real-time crypto price feeds
2. **Commodity Supply Chain Tracker** - A supply chain management system with verified inventory tracking

## New Files Added

### Contracts
- `contracts/PriceFeedLendingV1.sol` - Lending protocol contract
- `contracts/CommodityTrackerV1.sol` - Supply chain tracking contract

### Scripts
- `scripts/CryptoPriceFeed.ts` - Price feed attestation script
- `scripts/CommoditySupplyChain.ts` - Commodity inventory attestation script
- `scripts/utils/commodityHelpers.ts` - Utility functions for commodity attestations

### Deployment Scripts
- `scripts/deploy/deployLending.ts` - Deployment script for lending contract
- `scripts/deploy/deployCommodityTracker.ts` - Deployment script for tracker contract

### Tests
- `test/PriceFeedLendingV1.test.ts` - Unit tests for lending protocol
- `test/CommodityTrackerV1.test.ts` - Unit tests for supply chain tracker

### Configuration
- Updated `.env` with new environment variables for both projects

## Project 1: Crypto Price Feed Lending Protocol

### Description
A decentralized lending protocol that allows users to deposit FLR tokens as collateral and borrow stablecoins, with loan-to-value ratios determined by real-time price feeds from CoinGecko via FDC attestations.

### Key Features
- **Collateral Deposit**: Users can deposit FLR tokens as collateral
- **Borrowing**: Borrow stablecoins against collateral with 150% collateralization ratio
- **Price Updates**: Automated price updates using FDC-verified CoinGecko API data
- **Repayment**: Full loan repayment functionality
- **Liquidation**: Automatic liquidation when collateral value falls below threshold
- **Health Factor**: Real-time health factor calculation for positions

### Contract Functions
- `deposit(uint256 amount)` - Deposit collateral
- `borrow(uint256 amount)` - Borrow stablecoins
- `repay(uint256 amount)` - Repay loan
- `liquidate(address user)` - Liquidate undercollateralized positions
- `updatePriceWithProof(IWeb2Json.Proof)` - Update price with FDC proof
- `getHealthFactor(address user)` - Get position health factor

### FDC Integration
- API: `https://api.coingecko.com/api/v3/simple/price?ids=flare&vs_currencies=usd`
- JQ Filter: `{price: .flare.usd}`
- ABI Signature: `{"components": [{"internalType": "uint256", "name": "price", "type": "uint256"}],"name": "task","type": "tuple"}`

## Project 2: Commodity Supply Chain Tracker

### Description
A supply chain management system that tracks commodity shipments with verified inventory data from external APIs, enabling fraud detection and transparent supply chain auditing.

### Key Features
- **Supplier Registration**: Owner-controlled supplier registration
- **Inventory Attestation**: FDC-verified inventory data from supplier APIs
- **Shipment Creation**: Create shipments with hashed origin/destination for privacy
- **Delivery Tracking**: Mark shipments as delivered
- **Fraud Reporting**: Owner ability to report fraudulent activities
- **Audit Trail**: Complete event logging for all supply chain activities

### Contract Functions
- `registerSupplier(address, string)` - Register new suppliers
- `attestInventory(uint256, IWeb2Json.Proof)` - Attest inventory with FDC proof
- `createShipment(bytes32, bytes32, uint256)` - Create new shipment
- `markDelivered(uint256)` - Mark shipment as delivered
- `reportFraud(uint256, string)` - Report fraudulent shipment
- `getShipment(uint256)` - Get shipment details

### FDC Integration
- API: `https://example.com/supplier/inventory`
- JQ Filter: `{quantity: .stock, origin: .location}`
- ABI Signature: `{"components": [{"internalType": "uint256", "name": "quantity", "type": "uint256"},{"internalType": "string", "name": "origin", "type": "string"}],"name": "task","type": "tuple"}`

## Environment Variables

New environment variables added to `.env`:

```bash
# Lending / Price Feed
LENDING_CONTRACT_ADDRESS=
PRICE_FEED_API_URL=https://api.coingecko.com/api/v3/simple/price?ids=flare&vs_currencies=usd

# Commodity Tracker
COMMODITY_TRACKER_ADDRESS=
SUPPLIER_API_URL=https://example.com/supplier/inventory

# Common
FDC_API_KEY=
NETWORK=coston2
DEPLOYER_PRIVATE_KEY=
```

## Dependencies

Added axios for HTTP requests:
```bash
npm install axios
```

## Testing

Run tests with:
```bash
npx hardhat test
```

Tests include:
- Lending protocol deposit/borrow/repay/liquidate flows
- Supply chain supplier registration, inventory attestation, and shipment tracking
- Mock FDC proofs for testing

## Deployment

### Deploy Lending Contract
```bash
npx hardhat run scripts/deploy/deployLending.ts --network coston2
```

### Deploy Commodity Tracker
```bash
npx hardhat run scripts/deploy/deployCommodityTracker.ts --network coston2
```

## Usage Examples

### Update Price Feed
```bash
npx hardhat run scripts/CryptoPriceFeed.ts --network coston2
```

### Attest Commodity Inventory
```bash
npx hardhat run scripts/CommoditySupplyChain.ts --network coston2
```

## Security Considerations

- Both contracts use FDC verification for data authenticity
- Owner controls for critical functions (supplier registration, fraud reporting)
- Reentrancy protection in lending contract
- Input validation on all public functions
- Event emission for all state changes

## Integration with Existing FDC Infrastructure

The new projects follow the established FDC patterns:
- Use `ContractRegistry.getFdcVerification().verifyJsonApi()` for proof validation
- Follow the same attestation request flow as existing examples
- Store proof data in `/out` directory for traceability
- Use existing utility functions from `scripts/utils/fdc.ts`

## Future Enhancements

Potential improvements:
- Multi-collateral support in lending protocol
- Batch shipment processing in supply chain tracker
- Integration with DeFi protocols
- Enhanced fraud detection algorithms
- Mobile app interfaces
- Cross-chain functionality

## Support

For questions about these implementations, refer to the main FDC-101 README.md and Flare documentation at https://dev.flare.network/fdc/