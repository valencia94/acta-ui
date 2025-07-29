const https = require("https");

const url =
  process.argv[2] || "https://d7t9x3j66yd8k.cloudfront.net/aws-exports.js";

https
  .get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(
        `❌ Failed to fetch ${url}. HTTP Status Code: ${res.statusCode}`,
      );
      process.exit(1);
    }
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (data.includes("window.awsmobile")) {
        console.log("✅ AWS config detected in", url);
      } else {
        console.error("❌ AWS config missing from", url);
        process.exit(1);
      }
    });
  })
  .on("error", (err) => {
    console.error("❌ Failed to fetch", url, err);
    process.exit(1);
  });
