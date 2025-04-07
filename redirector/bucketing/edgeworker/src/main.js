import { EdgeKV } from "./edgekv.js";
import { logger } from "log";
import murmurHash3 from "murmurhash3js";

const NUM_BUCKETS = 20;

export async function onClientRequest(request) {
  const path = request.path;
  // Use MurmurHash to determine the bucket
  const hash = murmurHash3.x86.hash32(path);
  const bucketHash = hash % NUM_BUCKETS;
  const bucketId = `bucket_${bucketHash}`;
  logger.debug(`Bucket ID ${bucketId}`);

  // Pass the namespace and group id accordingly
  const edgeKv = new EdgeKV({
    namespace: "jaescalo",
    group: "countries",
  });
  const redir_bucket = await edgeKv.getJson({ item: bucketId });
  logger.debug(JSON.stringify(redir_bucket));

  if (redir_bucket) {
    const redir = redir_bucket["value"][path];
    logger.debug(redir);

    if (redir) {
      logger.debug(`Target ${redir}`);
      request.setVariable("PMUSER_DO_ERC", 0); // Disable Edge Redirector Cloudlet in case it is present. Requires adv XML in config
      request.respondWith(
        301,
        {
          Location: [redir],
        },
        ""
      );
    }
  }
}
