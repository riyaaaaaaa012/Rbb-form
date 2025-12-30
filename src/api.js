import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// Simple request interceptor for logging only
api.interceptors.request.use((config) => {
  console.log("🔵 Making request to:", config.baseURL + config.url);
  return config;
});

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log("✅ Success:", response.status, response.statusText);
    return response;
  },
  (error) => {
    console.error("❌ API Error Details:");
    console.error("URL:", error.config?.url);
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);
    return Promise.reject(error);
  }
);

export default api;
