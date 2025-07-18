// Quick backend status diagnostic

export async function quickBackendDiagnostic() {
  console.log("🔍 Quick Backend Diagnostic...");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  console.log(`🌐 API Base URL: ${apiBaseUrl}`);

  if (!apiBaseUrl || apiBaseUrl === "undefined") {
    console.error("❌ CRITICAL: API Base URL is not properly configured!");
    console.log("💡 Backend buttons will not work until API is configured");
    console.log("🛠️ Manual entry and UI features will still work");
    return false;
  }

  // Allow localhost for development, but warn about it
  if (apiBaseUrl.includes("localhost")) {
    console.warn("⚠️ Using localhost API - this is OK for development");
    console.log(
      "🔧 If localhost backend is not running, some features will be disabled",
    );
  }

  // Test basic connectivity
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${apiBaseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`🏥 Health check: ${response.status}`);

    if (response.ok) {
      console.log("✅ Backend API is responsive");
      return true;
    } else {
      console.warn(`⚠️ Backend API returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.error(
        "❌ Backend API timeout - connection is too slow or unavailable",
      );
    } else {
      console.error("❌ Cannot reach backend API:", error.message);
    }
    console.log(
      "💡 You can still use manual project entry and generate individual Actas",
    );
    return false;
  }
}

// Make it available globally for console testing
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).quickBackendDiagnostic =
    quickBackendDiagnostic;
}
