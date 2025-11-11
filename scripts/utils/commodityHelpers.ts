import { prepareAttestationRequestBase } from "./fdc";
import { ethers } from "hardhat";

export interface CommodityRequestBody {
    url: string;
    httpMethod: string;
    headers: string;
    queryParams: string;
    body: string;
    postProcessJq: string;
    abiSignature: string;
}

export async function buildCommodityAttestationRequest(
    apiUrl: string,
    postProcessJq: string,
    abiSignature: string,
    verifierUrl: string,
    apiKey: string
): Promise<any> {
    const requestBody: CommodityRequestBody = {
        url: apiUrl,
        httpMethod: "GET",
        headers: "{}",
        queryParams: "{}",
        body: "{}",
        postProcessJq: postProcessJq,
        abiSignature: abiSignature,
    };

    const attestationTypeBase = "Web2Json";
    const sourceIdBase = "PublicWeb2";

    return await prepareAttestationRequestBase(verifierUrl + "Web2Json/prepareRequest", apiKey, attestationTypeBase, sourceIdBase, requestBody);
}

export function encodeCommodityPayload(quantity: number, origin: string): string {
    // Encode as tuple (uint256, string)
    return ethers.utils.defaultAbiCoder.encode(["uint256", "string"], [quantity, origin]);
}