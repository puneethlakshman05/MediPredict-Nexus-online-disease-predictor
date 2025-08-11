// config.js

const isProduction = window.location.hostname!=="localhost"; // Vite sets this automatically

// Read from environment variables
const VITE_API_BASE_PROD_URL = import.meta.env.VITE_API_BASE_URL_PROD;
const VITE_API_BASE_DEV_URL = import.meta.env.VITE_API_BASE_URL_DEV;

// Fallbacks if not set
const API_BASE_URL = isProduction
  ? (VITE_API_BASE_PROD_URL || "https://medipredict-nexus-online-disease-o3p3.onrender.com")
  : (VITE_API_BASE_DEV_URL || "http://localhost:5000");

// Warn in console if variables are missing
if (isProduction && !VITE_API_BASE_PROD_URL) {
  console.warn("⚠️ VITE_API_BASE_URL_PROD is not set! Using fallback:", API_BASE_URL);
} else if (!isProduction && !VITE_API_BASE_DEV_URL) {
  console.warn("⚠️ VITE_API_BASE_URL_DEV is not set! Using fallback:", API_BASE_URL);
}

console.log("🌍 API_BASE_URL in runtime:", API_BASE_URL);

export default API_BASE_URL;
