import { EdgeKV } from "./edgekv.js";
import { TextEncoder } from 'encoding';
import { crypto } from 'crypto';
import { logger } from 'log';

// Function to compute SHA256 hash of a URL path
async function computeHash(url) {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onClientRequest (request) {

  const hash = await computeHash(request.url)
  logger.debug(`Hash ${hash}`)

  // Pass the namespace and group id accordingly
  const edgeKv = new EdgeKV({ namespace: "jaescalo", group: "athena_redirects" });
  const redir = await edgeKv.getJson({ item: hash});
  logger.debug(`Redir data ${redir}`)

  if (redir) {
    logger.debug(`Target ${redir.target}`)
    request.setVariable("PMUSER_DO_ERC", 0);    // Disable Edge Redirector Cloudlet in case it is present. Requires adv XML in config
    request.respondWith(301, {
      Location: [redir.target]
    }, '');
  }
}