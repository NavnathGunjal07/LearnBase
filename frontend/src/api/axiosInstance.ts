import axios from "axios";
import { toast } from "@/components/ui/use-toast";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log API calls in development
    if (import.meta.env.DEV) {
      console.log(
        `🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle different HTTP status codes
      const { status, data } = error.response;

      switch (status) {
        case 400:
          toast({
            title: "✕ Invalid Request",
            description:
              data.error ||
              data.message ||
              "Please check your input and try again",
            variant: "destructive",
          });
          break;
        case 401:
          // Handle unauthorized access
          toast({
            title: "✕ Unauthorized",
            description: data.error || "Please log in to continue",
            variant: "destructive",
            duration: 2000,
          });
          // Optionally redirect to auth page
          if (window.location.pathname !== "/auth") {
            window.location.href = "/auth";
          }
          break;
        case 403:
          toast({
            title: "✕ Forbidden",
            description:
              data.error ||
              data.message ||
              "You do not have permission to perform this action",
            variant: "destructive",
          });
          break;
        case 404:
          toast({
            title: "✕ Not Found",
            description:
              data.error ||
              data.message ||
              "The requested resource was not found",
            variant: "destructive",
          });
          break;
        case 500:
          toast({
            title: "✕ Server Error",
            description:
              "An error occurred on the server. Please try again later.",
            variant: "destructive",
          });
          break;
        default:
          toast({
            title: "✕ Error",
            description: data.error || data.message || "An error occurred",
            variant: "destructive",
          });
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast({
        title: "✕ Network Error",
        description:
          "Unable to connect to the server. Please check your internet connection.",
        variant: "destructive",
      });
    } else {
      // Something happened in setting up the request
      toast({
        title: "✕ Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
