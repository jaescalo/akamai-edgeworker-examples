"use strict";
import { createResponse } from 'create-response';
import { logger } from "log";
import { EdgeKV } from "./edgekv.js";
import { TextEncoderStream, TextDecoderStream } from 'text-encode-transform';


// Function to read and decode the request body
async function readRequestBody(request) {
    const reader = request.body
        .pipeThrough(new TextDecoderStream())
        .getReader();

    let chunks = '';
    let result;
    while (!(result = await reader.read()).done) {
        chunks += result.value;
    }
    return chunks;
}

export async function responseProvider(request) {
    // Get necessary headers from the request
    const namespace = request.getHeader('Ekv-namespace-id')[0];
    const group = request.getHeader('Ekv-group-id')[0];
    const item_id = request.getHeader('Ekv-item-id')[0];
    const ekv_operation = request.getHeader('Ekv-operation')[0];
    logger.debug("Item ID = %s", item_id);

    // Set up the EdgeKV
    const edgeKv = new EdgeKV({ namespace: namespace, group: group });

    // Read and decode the request body
    const requestBody = await readRequestBody(request);

    try {
        if ( ekv_operation == "delete" ) {
            await edgeKv.deleteNoWait({ item: item_id });
            logger.debug("Delete result = Success");
        } else {
            // Store the requestBody directly as the value
            await edgeKv.putTextNoWait({ item: item_id, value: requestBody });
            logger.debug("Upload result = Success");
        }
    } catch (error) {
        logger.debug("Error during upload = %s", error);
        // Return an error response to the client
        return createResponse(
            500, 
            { 'Content-Type': ['application/json; charset=utf-8'] }, 
            JSON.stringify({ error: "Failed to store the request body." })
        );
    }

    // Create a successful response and return it to the client
    return createResponse(
        200, 
        { 'Content-Type': ['application/json; charset=utf-8'] }, 
        JSON.stringify({ message: "Content uploaded successfully." })
    );
}
