import { run, web3 } from "hardhat";
import { CommodityTrackerV1Instance } from "../typechain-types";
import {
    prepareAttestationRequestBase,
    submitAttestationRequest,
    retrieveDataAndProofBaseWithRetry,
} from "./utils/fdc";

const CommodityTrackerV1 = artifacts.require("CommodityTrackerV1");

const { WEB2JSON_VERIFIER_URL_TESTNET, VERIFIER_API_KEY_TESTNET, COSTON2_DA_LAYER_URL, COMMODITY_TRACKER_ADDRESS } = process.env;

// Request data
const apiUrl = "https://example.com/supplier/inventory";
const postProcessJq = `{quantity: .stock, origin: .location}`;
const httpMethod = "GET";
const headers = "{}";
const queryParams = "{}";
const body = "{}";
const abiSignature = `{"components": [{"internalType": "uint256", "name": "quantity", "type": "uint256"},{"internalType": "string", "name": "origin", "type": "string"}],"name": "task","type": "tuple"}`;

// Configuration constants
const attestationTypeBase = "Web2Json";
const sourceIdBase = "PublicWeb2";
const verifierUrlBase = WEB2JSON_VERIFIER_URL_TESTNET;

async function prepareAttestationRequest(apiUrl: string, postProcessJq: string, abiSignature: string) {
    const requestBody = {
        url: apiUrl,
        httpMethod: httpMethod,
        headers: headers,
        queryParams: queryParams,
        body: body,
        postProcessJq: postProcessJq,
        abiSignature: abiSignature,
    };

    const url = `${verifierUrlBase}Web2Json/prepareRequest`;
    const apiKey = VERIFIER_API_KEY_TESTNET;

    return await prepareAttestationRequestBase(url, apiKey, attestationTypeBase, sourceIdBase, requestBody);
}

async function retrieveDataAndProof(abiEncodedRequest: string, roundId: number) {
    const url = `${COSTON2_DA_LAYER_URL}api/v1/fdc/proof-by-request-round-raw`;
    return await retrieveDataAndProofBaseWithRetry(url, abiEncodedRequest, roundId);
}

async function getCommodityTracker() {
    if (!COMMODITY_TRACKER_ADDRESS) {
        throw new Error("COMMODITY_TRACKER_ADDRESS not set");
    }
    return await CommodityTrackerV1.at(COMMODITY_TRACKER_ADDRESS);
}

async function attestInventoryOnContract(tracker: CommodityTrackerV1Instance, inventoryId: number, proof: any) {
    const IWeb2JsonVerification = await artifacts.require("IWeb2JsonVerification");
    const responseType = IWeb2JsonVerification._json.abi[0].inputs[0].components[1];
    const decodedResponse = web3.eth.abi.decodeParameter(responseType, proof.response_hex);

    const transaction = await tracker.attestInventory(inventoryId, {
        merkleProof: proof.proof,
        data: decodedResponse,
    });
    console.log("Inventory attested on contract:", transaction.tx);
}

async function main() {
    const inventoryId = 1; // Example inventory ID

    const data = await prepareAttestationRequest(apiUrl, postProcessJq, abiSignature);
    console.log("Data:", data);

    const abiEncodedRequest = data.abiEncodedRequest;
    const roundId = await submitAttestationRequest(abiEncodedRequest);

    const proof = await retrieveDataAndProof(abiEncodedRequest, roundId);

    const tracker = await getCommodityTracker();
    await attestInventoryOnContract(tracker, inventoryId, proof);
}

void main().then(() => {
    process.exit(0);
});