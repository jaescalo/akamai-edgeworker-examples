const fs = require("fs");
const csv = require("csv-parser");
const murmurhash3 = require("murmurhash3js");
const { program } = require("commander");
const path = require("path");

// Function to process redirects and bucket them
function bucketRedirects(inputFile, outputFile, numBuckets) {
  // Ensure numBuckets is a valid number
  numBuckets = Number(numBuckets);
  if (isNaN(numBuckets) || numBuckets <= 0) {
    console.error("Error: Number of buckets must be a positive number");
    process.exit(1);
  }

  console.log(`Creating ${numBuckets} buckets...`);

  // Create buckets (initialized as empty arrays)
  const buckets = {};
  for (let i = 0; i < numBuckets; i++) {
    buckets[i] = [];
  }

  // Load existing buckets if available (for comparison)
  const existingBuckets = loadExistingBuckets(outputFile);
  const modifiedBuckets = new Set();
  const modifiedBucketsData = {};

  // Read the input CSV and process each row
  const results = [];
  fs.createReadStream(inputFile)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", () => {
      console.log(`Processed ${results.length} redirects from CSV.`);

      // Assign each redirect to a bucket based on MurmurHash
      results.forEach((row) => {
        const source = row.source;
        const target = row.target;

        // Use MurmurHash to determine the bucket
        const hash = murmurhash3.x86.hash32(source);
        const bucketId = hash % numBuckets;

        // Add the redirect to the appropriate bucket
        buckets[bucketId].push([source, target]);
      });

      // Write to output CSV file directly
      const writeStream = fs.createWriteStream(outputFile);
      // Write header
      writeStream.write("key,value\n");

      // Write data rows and track changes
      for (const [bucketId, redirects] of Object.entries(buckets)) {
        if (redirects.length > 0) {
          // Create a clean JSON object with proper formatting
          const redirectsObj = {};
          redirects.forEach(([source, target]) => {
            // Remove any leading/trailing quotes if they exist
            const cleanSource = source.replace(/^"|"$/g, "");
            const cleanTarget = target.replace(/^"|"$/g, "");
            redirectsObj[cleanSource] = cleanTarget;
          });

          // Convert to clean JSON string
          let jsonStr = JSON.stringify(redirectsObj);

          // Check if this bucket has changed from previous run
          const bucketKey = `bucket_${bucketId}`;
          if (
            !existingBuckets[bucketKey] ||
            existingBuckets[bucketKey] !== jsonStr
          ) {
            modifiedBuckets.add(parseInt(bucketId));

            // Store the modified data for later use
            modifiedBucketsData[bucketKey] = `"${jsonStr.replace(/"/g, '""')}"`;
          }

          // Properly escape for CSV
          jsonStr = `"${jsonStr.replace(/"/g, '""')}"`;

          // Write to CSV with "bucket_" prefix for the key
          writeStream.write(`${bucketKey},${jsonStr}\n`);
        }
      }

      // Use the 'finish' event to ensure file is written before generating reports
      writeStream.on("finish", () => {
        // Generate report of modified buckets using the stored data
        generateModifiedBucketsReport(
          modifiedBuckets,
          modifiedBucketsData,
          outputFile
        );

        console.log(
          `Bucketing complete! Created ${
            Object.values(buckets).filter((b) => b.length > 0).length
          } buckets.`
        );
        console.log(`Results written to ${outputFile}`);

        // Display some stats
        const bucketSizes = Object.values(buckets).map((b) => b.length);
        const nonEmptyBuckets = bucketSizes.filter((s) => s > 0);
        const maxSize = Math.max(...nonEmptyBuckets, 0);
        const minSize = Math.min(...nonEmptyBuckets, 0);
        const avgSize = results.length / (nonEmptyBuckets.length || 1); // Avoid division by zero

        console.log(`Statistics:`);
        console.log(`- Largest bucket: ${maxSize} redirects`);
        console.log(`- Smallest bucket: ${minSize} redirects`);
        console.log(`- Average bucket size: ${avgSize.toFixed(2)} redirects`);
        console.log(`- Modified buckets: ${modifiedBuckets.size}`);
      });

      // End the write stream which triggers the 'finish' event
      writeStream.end();
    });
}

// Function to load existing buckets from the output file if it exists
function loadExistingBuckets(outputFile) {
  const existingBuckets = {};

  if (fs.existsSync(outputFile)) {
    try {
      const fileContent = fs.readFileSync(outputFile, "utf8");
      const lines = fileContent.split("\n").slice(1); // Skip header

      for (const line of lines) {
        if (!line.trim()) continue;

        const commaIndex = line.indexOf(",");
        if (commaIndex === -1) continue;

        const key = line.substring(0, commaIndex);
        let value = line.substring(commaIndex + 1);

        // Clean up the JSON string (remove CSV escaping)
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1).replace(/""/g, '"');
        }

        existingBuckets[key] = value;
      }
    } catch (error) {
      console.warn(
        `Warning: Could not read existing output file: ${error.message}`
      );
    }
  }

  return existingBuckets;
}

// Function to generate a report of modified buckets without re-reading the output file
function generateModifiedBucketsReport(
  modifiedBuckets,
  modifiedBucketsData,
  outputFile
) {
  if (modifiedBuckets.size === 0) {
    console.log("No buckets were modified in this run.");
    return;
  }

  // Create a dedicated folder for modified bucket files
  const outputDir = path.dirname(outputFile);
  const outputBaseName = path.basename(outputFile, path.extname(outputFile));
  const modifiedBucketsFolder = path.join(outputDir, "modified_buckets");

  // Create the folder if it doesn't exist
  if (!fs.existsSync(modifiedBucketsFolder)) {
    try {
      fs.mkdirSync(modifiedBucketsFolder, { recursive: true });
      console.log(
        `Created folder for modified buckets: ${modifiedBucketsFolder}`
      );
    } catch (error) {
      console.error(`Error creating modified buckets folder: ${error.message}`);
      // Fall back to the output directory if folder creation fails
      modifiedBucketsFolder = outputDir;
    }
  }

  // Create a timestamp for the filenames
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Create a new file with just the modified buckets
  const modifiedBucketsFile = path.join(
    modifiedBucketsFolder,
    `${outputBaseName}_modified_${timestamp}.csv`
  );

  const modifiedLines = ["key,value"];
  for (const bucketId of modifiedBuckets) {
    const bucketKey = `bucket_${bucketId}`;
    if (modifiedBucketsData[bucketKey]) {
      modifiedLines.push(`${bucketKey},${modifiedBucketsData[bucketKey]}`);
    }
  }

  fs.writeFileSync(modifiedBucketsFile, modifiedLines.join("\n"));
  console.log(
    `Modified buckets (${modifiedBuckets.size}) written to: ${modifiedBucketsFile}`
  );

  // Also write a simple list of modified bucket IDs for easy reference
  const bucketListFile = path.join(
    modifiedBucketsFolder,
    `${outputBaseName}_modified_buckets_${timestamp}.txt`
  );
  fs.writeFileSync(
    bucketListFile,
    Array.from(modifiedBuckets)
      .sort((a, b) => a - b)
      .join("\n")
  );
  console.log(`List of modified bucket IDs written to: ${bucketListFile}`);
}

// Command line arguments handling
function main() {
  program
    .description("A tool to process redirects into buckets")
    .option("-i, --input <file>", "input file path", "redirects.csv")
    .option("-o, --output <file>", "output file path", "bucketed_redirects.csv")
    .option("-b, --buckets <number>", "number of buckets", "100") // Changed to string default
    .helpOption("-h, --help", "display help information")
    .version("1.0.0", "-v, --version", "output the current version");

  program.parse(process.argv);
  const options = program.opts();

  console.log(`Input file: ${options.input}`);
  console.log(`Output file: ${options.output}`);
  console.log(`Number of buckets: ${options.buckets}`);

  bucketRedirects(options.input, options.output, options.buckets);
}

main();
