/*
(c) Copyright 2020 Akamai Technologies, Inc. Licensed under Apache 2 license.
Version: 1.1
Purpose:  Modify an HTML streamed response by replacing a text string across the entire response. The replacement string is stored in NetStorage.
*/

import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';
import { TextEncoderStream, TextDecoderStream } from 'text-encode-transform';
import { FindAndReplaceStream } from 'find-replace-stream.js';
import { logger } from 'log';

// Instantiate with JSON.parse is much faster than literal object
const jsonRefIdData = JSON.parse('{\
                      "0":"ERR_NONE",\
                      "6":"ERR_CONNECT_FAIL",\
                      "18":"ERR_ACCESS_DENIED",\
                      "21":"ERR_EDGEWORKER",\
                      "52":"ERR_INVALID_CLIENT_CERT",\
                      "97":"ERR_CONNECT_TIMEOUT"\
                      }');

var akamaiReferenceError = "";
var errorKey = "";

// Cache-Key modification is done on ClientRequest                  
export function onClientRequest(request) {
  akamaiReferenceError = request.getVariable('PMUSER_REFERENCE_ERROR');
  logger.log("PMUSER_REFERENCE_ERROR = %s", akamaiReferenceError);

  // Extract the first section of the Akamai Reference Error
  let akamaiRefErrorHead = akamaiReferenceError.split(/\./)[0];
  logger.log(akamaiRefErrorHead);

  // Check for the error name that matches the first section of the Akamai Reference Error 
  let key = "";
  for (key in jsonRefIdData) {
    if(akamaiRefErrorHead === key) {
      logger.log(jsonRefIdData[key]);
      errorKey = jsonRefIdData[key];
      break;
    }    
  }

  // Add the first section of the Ref Id to the Cache-Key
  request.setVariable('PMUSER_CACHE_ID_REF_ERR', akamaiRefErrorHead);
  request.cacheKey.includeVariable('PMUSER_CACHE_ID_REF_ERR');
}

export async function responseProvider (request) {

  // Get text to be searched for and new replacement text from Property Manager variables in the request object.
  const tosearchfor = "</body>";

  // Text for the replacement
  const toreplacewith = "<h4>Error:" + akamaiReferenceError + ": " + errorKey + "</h4>\n</body>";

  // Set to 0 to replace all, otherwise a number larger than 0 to limit replacements
  const howManyReplacements = 1;
  
  // For debugging URL only
  logger.log(request.scheme);
  logger.log(request.host);
  logger.log(request.url);
  logger.log(request.query);

  // Generate request 
  return httpRequest(`${request.scheme}://${request.host}${request.url}`).then(response => {

    // Remove some headers that could affect the response body
    var responseHeaders = response.getHeaders();
    delete responseHeaders['content-length'];
    delete responseHeaders['transfer-encoding'];
    delete responseHeaders['content-encoding'];

    // Modify the reponse body with the find/replace parameters
    return createResponse(
      response.status,
      responseHeaders,
      response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new FindAndReplaceStream(tosearchfor, toreplacewith, howManyReplacements)).pipeThrough(new TextEncoderStream())
    );
  });
}