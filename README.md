# FDC-101: Flare Data Connector Examples

Documented working examples demonstrating the use of the Flare Data Connector (FDC). This code starts from a simplified version of the [Flare Hardhat starter](https://github.com/flare-foundation/flare-hardhat-starter), and the purpose is purely educational. This first iteration focuses on how to bring external Web2 data sources onto the Flare blockchain.

##  What This Project Contains

- **Web2Json Attestations**: Fetch and verify data from external APIs
- **Weather Insurance**: Real-world insurance contracts using weather data
- **Proof of Reserves**: Cryptographic proof systems for asset verification
  

##  Web2Json Attestation Example

### Star Wars API Integration
- **Contract**: `StarWarsCharacterListV2` deployed at `0xE7f6ff7bD309621ae9e2339C829544E6C58bD8Ba`
- **Network**: Coston2 Testnet
- **Functionality**: Fetches character data from Star Wars API and processes it on-chain
- **Verification**: [View on Block Explorer](https://coston2-explorer.flare.network/address/0xE7f6ff7bD309621ae9e2339C829544E6C58bD8Ba#code)


### Web2Json Flow Diagram

```mermaid
sequenceDiagram
    participant YourScript as Your Script (Web2Json.ts)
    participant Verifier as FDC Verifier Server<br/>(web2json-verifier-test.flare.rocks)
    participant FdcHub as FDC Hub Contract<br/>(on Flare blockchain)
    participant Validators as Flare Validators<br/>(decentralized network)
    participant StarWarsAPI as External API<br/>(swapi.info)
    participant DALayer as Data Availability Layer<br/>(API endpoint)
    participant FdcVerification as FDC Verification System<br/>(ContractRegistry)
    participant SmartContract as Your Smart Contract<br/>(StarWarsCharacterListV2)

    Note over YourScript,SmartContract: Phase 1: Request Preparation & Submission
    
    YourScript->>Verifier: 1. API URL + JQ filter + ABI signature
    Note right of YourScript: apiUrl: "https://swapi.info/api/people/3"<br/>postProcessJq: "{name: .name, height: .height, ...}"<br/>abiSignature: "{"components": [...], "type": "tuple"}"
    
    Verifier->>YourScript: 2. ABI-encoded request (hex string)
    Note left of Verifier: Converts human-readable request<br/>to binary format for blockchain
    
    YourScript->>FdcHub: 3. Submit attestation request (pay fee)
    Note right of YourScript: fdcHub.requestAttestation(abiEncodedRequest, {value: requestFee})
    
    Note over YourScript,SmartContract: Phase 2: Decentralized Data Acquisition & Verification
    
    FdcHub->>Validators: 4. Broadcast request (start voting round)
    Note left of FdcHub: Creates voting round<br/>Round ID: 1063464
    
    Validators->>StarWarsAPI: 5. Fetch raw data independently
    Note right of Validators: Each validator makes HTTP GET request<br/>to get raw JSON response
    
    StarWarsAPI->>Validators: 6. Return raw JSON data
    Note left of StarWarsAPI: {"name": "R2-D2", "height": "96",<br/>"mass": "32", "films": [...], ...}
    
    Validators->>Validators: 7. Apply JQ filter to raw data
    Note right of Validators: {name: .name, height: .height, mass: .mass,<br/>numberOfFilms: .films | length,<br/>uid: (.url | split("/") | .[-1] | tonumber)}
    
    Validators->>DALayer: 8. Submit attestations with processed data
    Note right of Validators: Each validator submits their<br/>processed result for voting
    
    DALayer->>DALayer: 9. Generate Merkle proof from attestations
    Note right of DALayer: Creates cryptographic proof<br/>when supermajority agrees
    
    Note over YourScript,SmartContract: Phase 3: Proof Retrieval & Smart Contract Usage
    
    YourScript->>DALayer: 10. Request proof by round ID
    Note right of YourScript: retrieveDataAndProof(abiEncodedRequest, roundId)<br/>URL: coston2-data-availability.flare.network/api/v1/fdc/proof-by-request-round-raw
    
    DALayer->>YourScript: 11. Return proof (response_hex + merkle_proof)
    Note left of DALayer: Returns:<br/>- response_hex: processed data<br/>- proof: merkle proof array
    
    YourScript->>SmartContract: 12. Deploy contract
    Note right of YourScript: StarWarsCharacterListV2.new()
    
    YourScript->>SmartContract: 13. Call addCharacter() with proof
    Note right of YourScript: characterList.addCharacter({<br/>merkleProof: proof.proof,<br/>data: decodedResponse<br/>})
    
    SmartContract->>FdcVerification: 14. Verify proof validity
    Note right of SmartContract: ContractRegistry.getFdcVerification()<br/>.verifyJsonApi(_proof)
    
    FdcVerification->>SmartContract: 15. Proof verification result
    Note left of FdcVerification: Returns true if proof is valid
    
    SmartContract->>SmartContract: 16. Calculate BMI & store data
    Note right of SmartContract: bmi = (mass * 100 * 100) / (height * height)<br/>Store: {name: "R2-D2", numberOfMovies: 6,<br/>apiUid: 3, bmi: 34}
    
    SmartContract->>YourScript: 17. Return stored characters
    Note left of SmartContract: getAllCharacters() returns<br/>processed character data with calculated BMI
```

#### Step-by-Step Explanation of the flow:

1. **Request Preparation**: Script sends Star Wars API URL and processing rules to FDC verifier server
2. **Encode Request**: Server creates encoded attestation request
3. **Submit to FDC Hub**: Encoded request submitted to FDC Hub contract on Flare blockchain
4. **Voting Round**: Validators fetch data from Star Wars API during voting round
5. **Verify & Vote**: Validators verify the data and vote on its authenticity
6. **Generate Proof**: DA Layer generates cryptographic proof after round finalization
7. **Request Proof**: Script requests proof from DA Layer
8. **Return Proof**: DA Layer returns the cryptographic proof
9. **Verify & Process**: Smart contract verifies proof and calculates BMI from character data
10. **Store Onchain**: Enhanced character information stored permanently on Flare blockchain

#### Key Components:

- **External API**: Source of real-world data (Star Wars API)
- **FDC Verifier Server**: Prepares attestation requests
- **FDC Hub Contract**: Manages attestation requests and voting rounds
- **Validators**: Fetch and verify external data
- **DA Layer**: Generates cryptographic proofs
- **Smart Contract**: Processes verified data and stores results

### Weather Insurance Contracts (full demo soon)
- **Min Temperature Insurance**: Insurance against low temperature events
- **Weather ID Verification**: Location-based weather data verification
- **Real-time Data**: Integration with OpenWeather API

____
## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Yarn package manager
- Flare testnet tokens (Coston2 faucet)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/TheVictorMunoz/FDC-101.git
   cd FDC-101
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env
   ```

4. **Configure your private key**:
   Edit `.env` file and add your wallet's private key:
   ```
   PRIVATE_KEY=your_private_key_here
   ```

5. **Get testnet tokens**:
   - Visit [Coston2 Faucet](https://coston2-faucet.towolabs.com/)
   - Enter your wallet address and request C2FLR tokens
 

____

##  Running Examples

### Web2Json Example (Star Wars API)
```bash
yarn hardhat run scripts/fdcExample/Web2Json.ts --network coston2
```

This will:
- Submit an attestation request to FDC Hub
- Wait for voting round finalization
- Generate cryptographic proof
- Deploy smart contract
- Fetch and display Star Wars character data

### Weather Insurance Examples
```bash
# Create weather insurance policy
yarn hardhat run scripts/weatherInsurance/weatherId/createPolicy.ts --network coston2

# Resolve weather insurance policy
yarn hardhat run scripts/weatherInsurance/weatherId/resolvePolicy.ts --network coston2
```

##  Project Structure

```
├── contracts/
│   ├── crossChainFdc/          # Cross-chain FDC contracts
│   └── fdcExample/            # FDC example contracts
├── scripts/
│   ├── fdcExample/            # Web2Json and FDC examples
│   ├── weatherInsurance/      # Weather insurance contracts
│   ├── proofOfReserves/       # Proof of reserves functionality
│   └── utils/                 # Utility functions
├── utils/                     # Network utilities
└── hardhat.config.ts         # Hardhat configuration
```

##  Configuration

### Supported Networks
- **Coston2 Testnet** (Chain ID: 114) - Primary testnet
- **Coston Testnet** (Chain ID: 16)
- **Songbird** (Chain ID: 19)
- **Flare Mainnet** (Chain ID: 14)

### Environment Variables
```bash
PRIVATE_KEY=your_wallet_private_key
FLARE_RPC_API_KEY=your_flare_api_key
FLARESCAN_API_KEY=your_flarescan_api_key
OPEN_WEATHER_API_KEY=your_openweather_api_key
```


### FDC Attestation Types and Features
- **Web2Json**: HTTP API data fetching and verification
- **Payment Verification**: Payment transaction verification
- **Balance Decreasing**: Balance change verification
- **Address Validity**: Address format verification
- **Block Height**: Block existence verification


##  Example Output

Running the Web2Json example produces:
```
Star Wars Characters:
[
  [
    'R2-D2',
    '6',
    '3', 
    '34',
    name: 'R2-D2',
    numberOfMovies: '6',
    apiUid: '3',
    bmi: '34'
  ]
]
```

##  Useful Links

- **Voting Round Explorer**: https://coston2-systems-explorer.flare.rocks/
- **Block Explorer**: https://coston2-explorer.flare.network/
- **FDC Documentation**: https://dev.flare.network/fdc/
- **Flare Developer Hub**: https://dev.flare.network/

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on testnet
5. Submit a PR

___

Deepwiki: https://deepwiki.com/TheVictorMunoz/FDC-101 

___
