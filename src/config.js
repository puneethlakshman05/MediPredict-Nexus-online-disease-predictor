const isProduction = import.meta.env.PROD;  // Vite sets this automatically

const API_BASE_URL = isProduction 
  ? import.meta.env.VITE_API_BASE_URL_PROD 
  : import.meta.env.VITE_API_BASE_URL_DEV;

export default API_BASE_URL;
