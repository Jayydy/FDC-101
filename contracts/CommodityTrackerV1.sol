// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {IWeb2Json} from "@flarenetwork/flare-periphery-contracts/coston2/IWeb2Json.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

struct Supplier {
    address supplierAddress;
    string name;
    bool isRegistered;
}

struct Inventory {
    uint256 quantity;
    string origin;
    uint256 timestamp;
}

struct Shipment {
    uint256 id;
    bytes32 hashedOrigin;
    bytes32 hashedDestination;
    address supplier;
    uint256 quantity;
    uint256 timestamp;
    bool delivered;
}

contract CommodityTrackerV1 is Ownable {
    address public verifier;

    mapping(address => Supplier) public suppliers;
    mapping(uint256 => Inventory) public inventories;
    mapping(uint256 => Shipment) public shipments;
    uint256 public nextShipmentId;

    event SupplierRegistered(address indexed supplier, string name);
    event InventoryAttested(uint256 indexed inventoryId, uint256 quantity, string origin);
    event ShipmentCreated(uint256 indexed shipmentId, bytes32 hashedOrigin, bytes32 hashedDestination, address supplier, uint256 quantity);
    event ShipmentDelivered(uint256 indexed shipmentId);
    event FraudAlert(uint256 indexed shipmentId, string reason);

    error SupplierNotRegistered();
    error InvalidProof();
    error ShipmentAlreadyDelivered();
    error Unauthorized();

    constructor(address _verifier) Ownable(msg.sender) {
        verifier = _verifier;
        nextShipmentId = 1;
    }

    function registerSupplier(address supplierAddress, string calldata name) external onlyOwner {
        suppliers[supplierAddress] = Supplier(supplierAddress, name, true);
        emit SupplierRegistered(supplierAddress, name);
    }

    function attestInventory(uint256 inventoryId, IWeb2Json.Proof calldata proof) external {
        if (!suppliers[msg.sender].isRegistered) revert SupplierNotRegistered();
        if (!isJsonApiProofValid(proof)) revert InvalidProof();

        // Decode inventory data from proof
        (uint256 quantity, string memory origin) = abi.decode(proof.data.responseBody.abiEncodedData, (uint256, string));
        inventories[inventoryId] = Inventory(quantity, origin, block.timestamp);
        emit InventoryAttested(inventoryId, quantity, origin);
    }

    function createShipment(bytes32 hashedOrigin, bytes32 hashedDestination, uint256 quantity) external {
        if (!suppliers[msg.sender].isRegistered) revert SupplierNotRegistered();

        shipments[nextShipmentId] = Shipment(nextShipmentId, hashedOrigin, hashedDestination, msg.sender, quantity, block.timestamp, false);
        emit ShipmentCreated(nextShipmentId, hashedOrigin, hashedDestination, msg.sender, quantity);
        nextShipmentId++;
    }

    function markDelivered(uint256 shipmentId) external {
        Shipment storage shipment = shipments[shipmentId];
        if (shipment.supplier != msg.sender) revert Unauthorized();
        if (shipment.delivered) revert ShipmentAlreadyDelivered();

        shipment.delivered = true;
        emit ShipmentDelivered(shipmentId);
    }

    function reportFraud(uint256 shipmentId, string calldata reason) external onlyOwner {
        emit FraudAlert(shipmentId, reason);
    }

    function isJsonApiProofValid(IWeb2Json.Proof calldata _proof) private view returns (bool) {
        return ContractRegistry.getFdcVerification().verifyJsonApi(_proof);
    }

    function getShipment(uint256 shipmentId) external view returns (Shipment memory) {
        return shipments[shipmentId];
    }
}