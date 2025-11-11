// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {IWeb2Json} from "@flarenetwork/flare-periphery-contracts/coston2/IWeb2Json.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

struct PriceData {
    uint256 price;
    uint256 timestamp;
}

contract PriceFeedLendingV1 is Ownable {
    IERC20 public collateralToken; // e.g., FLR
    IERC20 public stableToken; // e.g., USDC or similar
    address public verifier;

    mapping(address => uint256) public collateralBalances;
    mapping(address => uint256) public borrowBalances;
    PriceData public latestPrice;

    uint256 public constant COLLATERAL_RATIO = 150; // 150% collateralization
    uint256 public constant PRICE_DECIMALS = 1e8; // Assuming 8 decimals for price

    event Deposited(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Liquidated(address indexed user, uint256 collateralSeized, uint256 debtRepaid);
    event PriceUpdated(uint256 newPrice, uint256 timestamp);

    error InsufficientCollateral();
    error InsufficientBalance();
    error InvalidProof();
    error PriceTooOld();
    error LiquidationNotNeeded();

    constructor(address _collateralToken, address _stableToken, address _verifier) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
        stableToken = IERC20(_stableToken);
        verifier = _verifier;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        collateralToken.transferFrom(msg.sender, address(this), amount);
        collateralBalances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function borrow(uint256 amount) external {
        uint256 maxBorrow = (collateralBalances[msg.sender] * latestPrice.price * PRICE_DECIMALS) / (COLLATERAL_RATIO * 1e18);
        if (amount > maxBorrow) revert InsufficientCollateral();
        stableToken.transfer(msg.sender, amount);
        borrowBalances[msg.sender] += amount;
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        if (borrowBalances[msg.sender] < amount) revert InsufficientBalance();
        stableToken.transferFrom(msg.sender, address(this), amount);
        borrowBalances[msg.sender] -= amount;
        emit Repaid(msg.sender, amount);
    }

    function liquidate(address user) external {
        uint256 collateralValue = (collateralBalances[user] * latestPrice.price * PRICE_DECIMALS) / 1e18;
        uint256 debt = borrowBalances[user];
        if (collateralValue >= debt * COLLATERAL_RATIO / 100) revert LiquidationNotNeeded();

        uint256 collateralSeized = collateralBalances[user];
        collateralBalances[user] = 0;
        borrowBalances[user] = 0;
        collateralToken.transfer(msg.sender, collateralSeized);
        // Assuming stableToken is held by contract
        emit Liquidated(user, collateralSeized, debt);
    }

    function updatePriceWithProof(IWeb2Json.Proof calldata proof) external {
        if (!isJsonApiProofValid(proof)) revert InvalidProof();

        // Decode price from proof
        uint256 newPrice = abi.decode(proof.data.responseBody.abiEncodedData, (uint256));
        latestPrice = PriceData(newPrice, block.timestamp);
        emit PriceUpdated(newPrice, block.timestamp);
    }

    function isJsonApiProofValid(IWeb2Json.Proof calldata _proof) private view returns (bool) {
        return ContractRegistry.getFdcVerification().verifyJsonApi(_proof);
    }

    // Helper function to get health factor
    function getHealthFactor(address user) external view returns (uint256) {
        if (borrowBalances[user] == 0) return type(uint256).max;
        uint256 collateralValue = (collateralBalances[user] * latestPrice.price * PRICE_DECIMALS) / 1e18;
        return (collateralValue * 100) / borrowBalances[user];
    }
}