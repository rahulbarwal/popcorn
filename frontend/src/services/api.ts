import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

// API Configuration
const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL as string) || "http://localhost:3001";
const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    (config as any).metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response time in development
    if (import.meta.env.DEV && response.config.metadata) {
      const endTime = new Date();
      const duration =
        endTime.getTime() - response.config.metadata.startTime.getTime();
      console.log(
        `API Request: ${response.config.method?.toUpperCase()} ${
          response.config.url
        } - ${duration}ms`
      );
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear auth token and redirect to login
          localStorage.removeItem("auth_token");
          window.location.href = "/login";
          break;
        case 403:
          // Forbidden
          console.error("Access forbidden:", data);
          break;
        case 404:
          // Not found
          console.error("Resource not found:", error.config?.url);
          break;
        case 422:
          // Validation error
          console.error("Validation error:", data);
          break;
        case 500:
          // Server error
          console.error("Server error:", data);
          break;
        default:
          console.error("API Error:", status, data);
      }
    } else if (error.request) {
      // Network error
      console.error("Network error:", error.message);
    } else {
      // Other error
      console.error("Request error:", error.message);
    }

    return Promise.reject(error);
  }
);

// API Error class
export class ApiError extends Error {
  public status?: number;
  public data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Generic API request function with retry logic
async function apiRequest<T>(
  config: AxiosRequestConfig,
  retries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: AxiosError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await apiClient.request<T>(config);
      return response.data;
    } catch (error) {
      lastError = error as AxiosError;

      // Don't retry on client errors (4xx)
      if (
        lastError.response?.status &&
        lastError.response.status >= 400 &&
        lastError.response.status < 500
      ) {
        break;
      }

      // Don't retry on last attempt
      if (attempt === retries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`API request failed, retrying... (${attempt}/${retries})`);
    }
  }

  // Throw custom error
  const status = lastError!.response?.status;
  const data = lastError!.response?.data;
  const message = data?.message || lastError!.message || "API request failed";

  throw new ApiError(message, status, data);
}

// HTTP Methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: "GET", url }),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: "POST", url, data }),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: "PUT", url, data }),

  patch: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => apiRequest<T>({ ...config, method: "PATCH", url, data }),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: "DELETE", url }),
};

export default apiClient;
