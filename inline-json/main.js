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

const jsonEndPoint = '/inline.json';
const htmlEndPoint = '/json-inline-demo/index.html';

// Fetch JSON from NetStorage (configured as an origin in the property).
async function getJSON() {
  const response = await httpRequest(jsonEndPoint);
  if (response.ok) {
      return await response.text();
  } else {
      return { error: `Failed to return`};
  }
}

export async function responseProvider (request) {
  // Get text to be searched for and new replacement text from Property Manager variables in the request object.
  const tosearchfor = "</body>";

  // Text from the JSON file hosted in NetStorage
  const newtext = await Promise.resolve(getJSON());
  logger.log(newtext);

  // Text for the replacement
  const toreplacewith = "\t" + `<data class="json-data" value='` + newtext + "'></data>\n</body>";

  // Set to 0 to replace all, otherwise a number larger than 0 to limit replacements
  const howManyReplacements = 1;

  return httpRequest(htmlEndPoint).then(response => {
    return createResponse(
      response.status,
      response.headers,
      response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new FindAndReplaceStream(tosearchfor, toreplacewith, howManyReplacements)).pipeThrough(new TextEncoderStream())
    );
  });
}

