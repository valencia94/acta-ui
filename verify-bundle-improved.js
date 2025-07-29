// verify-bundle-improved.js
// Enhanced script to verify production bundle components with better detection

const fs = require("fs");
const path = require("path");

function checkBundleContents() {
  console.log("🔍 ENHANCED BUNDLE VERIFICATION");
  console.log("=".repeat(60));

  const distDir = path.join(__dirname, "dist");
  const assetsDir = path.join(distDir, "assets");

  if (!fs.existsSync(assetsDir)) {
    console.log("❌ Assets directory not found:", assetsDir);
    return;
  }

  // Find main JS bundle (usually the largest one)
  const jsFiles = fs
    .readdirSync(assetsDir)
    .filter((file) => file.endsWith(".js"));

  console.log("📁 JS Files found:", jsFiles);

  // Get the main bundle (largest file)
  let mainBundle = "";
  let largestSize = 0;

  jsFiles.forEach((file) => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    if (stats.size > largestSize) {
      largestSize = stats.size;
      mainBundle = file;
    }
  });

  if (!mainBundle) {
    console.log("❌ No main bundle found");
    return;
  }

  console.log(
    `📦 Main bundle: ${mainBundle} (${(largestSize / 1024).toFixed(2)} KB)`,
  );

  const bundlePath = path.join(assetsDir, mainBundle);
  const bundleContent = fs.readFileSync(bundlePath, "utf8");

  // Enhanced component detection function
  function findInBundle(name, category) {
    const patterns = [
      name, // exact match
      name.toLowerCase(), // lowercase
      name.charAt(0).toLowerCase() + name.slice(1), // camelCase
      name
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .substring(1), // kebab-case
      name
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .substring(1), // snake_case
      `"${name}"`, // quoted
      `'${name}'`, // single quoted
      `${name}:`, // object property
      `${name}=`, // assignment
      `${name}(`, // function call
      `${name}Component`, // with Component suffix
      `use${name}`, // hook pattern
      `${name}View`, // with View suffix
      `${name}Manager`, // with Manager suffix
      `${name}Dialog`, // with Dialog suffix
      `${name}Status`, // with Status suffix
      `${name}Table`, // with Table suffix
      `${name}Preview`, // with Preview suffix
      `${name}Buttons`, // with Buttons suffix
    ];

    for (const pattern of patterns) {
      if (bundleContent.includes(pattern)) {
        console.log(`  ✅ ${name}: Found as "${pattern}"`);
        return true;
      }
    }

    console.log(`  ❌ ${name}: Not found`);
    return false;
  }

  // Check for components
  console.log("\n🎨 COMPONENT VERIFICATION:");
  const components = [
    "Dashboard",
    "AdminDashboard",
    "Login",
    "Header",
    "ProjectTable",
    "PMProjectManager",
    "DynamoProjectsView",
    "DocumentStatus",
    "EmailInputDialog",
    "ActaButtons",
    "PDFPreview",
  ];

  let foundComponents = 0;
  components.forEach((component) => {
    if (findInBundle(component, "component")) {
      foundComponents++;
    }
  });

  // Check for API functions
  console.log("\n🔧 API FUNCTION VERIFICATION:");
  const apiFunctions = [
    "getSummary",
    "getTimeline",
    "getDownloadUrl",
    "sendApprovalEmail",
    "generateActaDocument",
    "checkDocumentInS3",
    "getProjectsByPM",
  ];

  let foundApiFunctions = 0;
  apiFunctions.forEach((func) => {
    if (findInBundle(func, "function")) {
      foundApiFunctions++;
    }
  });

  // Check for utilities
  console.log("\n🛠️ UTILITY VERIFICATION:");
  const utilities = [
    "fetchWrapper",
    "getAuthToken",
    "backendDiagnostic",
    "useAuth",
    "useIdleLogout",
  ];

  let foundUtilities = 0;
  utilities.forEach((util) => {
    if (findInBundle(util, "utility")) {
      foundUtilities++;
    }
  });

  // Check for key UI/library patterns
  console.log("\n📚 LIBRARY & UI PATTERN CHECK:");
  const patterns = [
    {
      name: "React",
      searches: ["react", "createElement", "useState", "useEffect"],
    },
    { name: "Framer Motion", searches: ["framer", "motion.", "animate"] },
    {
      name: "Lucide Icons",
      searches: ["lucide", "FileText", "Download", "Plus"],
    },
    {
      name: "AWS Amplify",
      searches: ["amplify", "aws-amplify", "fetchAuthSession"],
    },
    { name: "Chakra UI", searches: ["chakra", "ChakraProvider"] },
    {
      name: "React Router",
      searches: ["router", "BrowserRouter", "Routes", "Navigate"],
    },
    {
      name: "Tailwind CSS",
      searches: ["bg-gradient", "text-", "px-", "rounded-", "shadow"],
    },
    {
      name: "React Hot Toast",
      searches: ["toast", "Toaster", "react-hot-toast"],
    },
  ];

  patterns.forEach((pattern) => {
    const found = pattern.searches.some((search) =>
      bundleContent.includes(search),
    );
    console.log(
      `  ${found ? "✅" : "❌"} ${pattern.name}: ${found ? "Present" : "Missing"}`,
    );
  });

  // Look for specific component functionality indicators
  console.log("\n🔍 FUNCTIONALITY INDICATORS:");
  const functionalityPatterns = [
    { name: "Email Dialog", searches: ["email", "dialog", "modal"] },
    { name: "Project Management", searches: ["project", "dynamo", "table"] },
    {
      name: "Document Generation",
      searches: ["document", "pdf", "docx", "acta"],
    },
    { name: "File Download", searches: ["download", "blob", "url"] },
    { name: "Authentication", searches: ["auth", "login", "token", "session"] },
    { name: "API Integration", searches: ["fetch", "api", "endpoint"] },
  ];

  functionalityPatterns.forEach((pattern) => {
    const found = pattern.searches.some((search) =>
      bundleContent.includes(search),
    );
    console.log(
      `  ${found ? "✅" : "❌"} ${pattern.name}: ${found ? "Present" : "Missing"}`,
    );
  });

  // Bundle analysis
  console.log("\n📊 BUNDLE ANALYSIS:");
  console.log(`  📦 Bundle size: ${(largestSize / 1024).toFixed(2)} KB`);
  console.log(
    `  🔤 Content length: ${bundleContent.length.toLocaleString()} chars`,
  );

  // Look for minification indicators
  const isMinified =
    bundleContent.includes("var ") ||
    bundleContent.includes("function(") ||
    bundleContent.length / bundleContent.split("\n").length > 1000;
  console.log(`  🗜️ Minified: ${isMinified ? "Yes" : "No"}`);

  // Summary
  console.log("\n📋 VERIFICATION SUMMARY:");
  console.log("=".repeat(60));
  console.log(
    `Components found: ${foundComponents}/${components.length} (${((foundComponents / components.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `API functions found: ${foundApiFunctions}/${apiFunctions.length} (${((foundApiFunctions / apiFunctions.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Utilities found: ${foundUtilities}/${utilities.length} (${((foundUtilities / utilities.length) * 100).toFixed(1)}%)`,
  );

  const totalExpected =
    components.length + apiFunctions.length + utilities.length;
  const totalFound = foundComponents + foundApiFunctions + foundUtilities;
  const overallPercentage = ((totalFound / totalExpected) * 100).toFixed(1);

  console.log(
    `\n🎯 OVERALL SCORE: ${totalFound}/${totalExpected} (${overallPercentage}%)`,
  );

  if (overallPercentage >= 90) {
    console.log(
      "🎉 EXCELLENT: Bundle appears to contain all critical components!",
    );
  } else if (overallPercentage >= 70) {
    console.log("✅ GOOD: Most critical components are present in the bundle.");
  } else if (overallPercentage >= 50) {
    console.log(
      "⚠️ WARNING: Some critical components may be missing from the bundle.",
    );
  } else {
    console.log(
      "❌ CRITICAL: Many expected components are missing from the bundle.",
    );
  }

  console.log("\n✨ Enhanced verification complete!");
}

checkBundleContents();
