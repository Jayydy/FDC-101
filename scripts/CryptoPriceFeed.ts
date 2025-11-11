import { run, web3 } from "hardhat";
import { PriceFeedLendingV1Instance } from "../typechain-types";
import {
    prepareAttestationRequestBase,
    submitAttestationRequest,
    retrieveDataAndProofBaseWithRetry,
} from "./utils/fdc";

const PriceFeedLendingV1 = artifacts.require("PriceFeedLendingV1");

const { WEB2JSON_VERIFIER_URL_TESTNET, VERIFIER_API_KEY_TESTNET, COSTON2_DA_LAYER_URL, LENDING_CONTRACT_ADDRESS } = process.env;

// Request data
const apiUrl = "https://api.coingecko.com/api/v3/simple/price?ids=flare&vs_currencies=usd";
const postProcessJq = `{price: .flare.usd}`;
const httpMethod = "GET";
const headers = "{}";
const queryParams = "{}";
const body = "{}";
const abiSignature = `{"components": [{"internalType": "uint256", "name": "price", "type": "uint256"}],"name": "task","type": "tuple"}`;

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

async function getLendingContract() {
    if (!LENDING_CONTRACT_ADDRESS) {
        throw new Error("LENDING_CONTRACT_ADDRESS not set");
    }
    return await PriceFeedLendingV1.at(LENDING_CONTRACT_ADDRESS);
}

async function updatePriceOnContract(lendingContract: PriceFeedLendingV1Instance, proof: any) {
    const IWeb2JsonVerification = await artifacts.require("IWeb2JsonVerification");
    const responseType = IWeb2JsonVerification._json.abi[0].inputs[0].components[1];
    const decodedResponse = web3.eth.abi.decodeParameter(responseType, proof.response_hex);

    const transaction = await lendingContract.updatePriceWithProof({
        merkleProof: proof.proof,
        data: decodedResponse,
    });
    console.log("Price updated on contract:", transaction.tx);
}

async function main() {
    const data = await prepareAttestationRequest(apiUrl, postProcessJq, abiSignature);
    console.log("Data:", data);

    const abiEncodedRequest = data.abiEncodedRequest;
    const roundId = await submitAttestationRequest(abiEncodedRequest);

    const proof = await retrieveDataAndProof(abiEncodedRequest, roundId);

    const lendingContract = await getLendingContract();
    await updatePriceOnContract(lendingContract, proof);
}

void main().then(() => {
    process.exit(0);
});