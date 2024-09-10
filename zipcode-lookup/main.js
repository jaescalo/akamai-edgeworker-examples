/*
(c) Copyright 2020 Akamai Technologies, Inc. Licensed under Apache 2 license.

Version: 1.0.0

Purpose:
  Implements a simple ZIP Code status lookup in EdgeKV.
*/

import { createResponse } from 'create-response';
import { EdgeKV } from './edgekv.js';
`import { logger } from 'log';`

// Create simple response based on result of ZIP Code lookup in EdgeKV
async function zip_code_lookup(request) {
    
    // Defaults to use if item is in EdgeKV. When a ZIP Code is blocked EdgeKV will return "blocked";
    let default_response = {"zipCodeStatus": "unblocked"};
    let edgeKvResponse = "";
    let err_msg="";

    // Retrieve ZIP Code from Edgescape header and extract he first value
    let zipCode = request.userLocation.zipCode;
    logger.log(zipCode);
    let key = zipCode.split(/\+|-/)[0];
    logger.log(key);
    
    // Set Up EdgeKV
    const edgeKv = new EdgeKV({namespace: "techjam", group: "participant7"});
    
    // Retrieve the status associated with the ZIP Code using the latter 
    // as key. We use a default status if the item is not found.
    try {
        edgeKvResponse = await edgeKv.getJson({ item: key, 
                                          default_value: default_response });
    } catch (error) {
        // Catch the error and store the error message to use in a response
        // header for debugging. Use a default response as well in this case.
        err_msg = error.toString();
        edgeKvResponse = default_response;
    }
    
    logger.log(edgeKvResponse);

    // We choose to always send back a 200 OK with the status of the ZIP code
    // and just log any errors in the 'X-EKV-ERROR' response header
    let response = {status: 200, 
                    headers: 
                      {'Content-Type': ['application/json'], 
                       // Safely Encode the error message to remove unsafe chars
                       // but also replace some encoded strings with safe chars for readability
                       'X-EKV-ERROR': [encodeURI(err_msg).replace(/(%20|%0A|%7B|%22|%7D)/g, " ")]
                      },
                    body: edgeKvResponse};
    
    // Send Response
    return createResponse(response.status,
                          response.headers,
                          JSON.stringify(response.body));
}

export async function responseProvider(request) {
    return zip_code_lookup(request)
}