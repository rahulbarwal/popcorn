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
    // Enhanced error handling with better categorization
    const enhancedError = new ApiError(
      error.message || "Request failed",
      error.response?.status,
      error.response?.data
    );

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      // Extract error message from response
      const errorMessage =
        data?.error || data?.message || `HTTP ${status} Error`;
      enhancedError.message = errorMessage;

      switch (status) {
        case 400:
          // Bad Request
          enhancedError.message =
            data?.error || "Invalid request. Please check your input.";
          break;
        case 401:
          // Unauthorized - clear auth token and redirect to login
          localStorage.removeItem("auth_token");
          enhancedError.message =
            "Your session has expired. Please log in again.";
          // Don't redirect immediately in case this is handled by the component
          setTimeout(() => {
            if (!localStorage.getItem("auth_token")) {
              window.location.href = "/login";
            }
          }, 1000);
          break;
        case 403:
          // Forbidden
          enhancedError.message =
            "You do not have permission to perform this action.";
          break;
        case 404:
          // Not found
          enhancedError.message = "The requested resource was not found.";
          break;
        case 409:
          // Conflict
          enhancedError.message =
            data?.error ||
            "A conflict occurred. The resource may already exist.";
          break;
        case 422:
          // Validation error
          enhancedError.message =
            data?.error || "Please check your input and try again.";
          break;
        case 429:
          // Rate limit exceeded
          enhancedError.message =
            "Too many requests. Please wait a moment and try again.";
          break;
        case 500:
          // Server error
          enhancedError.message =
            "A server error occurred. Please try again later.";
          break;
        case 502:
        case 503:
        case 504:
          // Service unavailable
          enhancedError.message =
            "The service is temporarily unavailable. Please try again later.";
          break;
        default:
          enhancedError.message = errorMessage;
      }

      console.error(`API Error ${status}:`, {
        url: error.config?.url,
        method: error.config?.method,
        status,
        message: enhancedError.message,
        data,
      });
    } else if (error.request) {
      // Network error - no response received
      if (!navigator.onLine) {
        enhancedError.message =
          "You appear to be offline. Please check your internet connection.";
      } else if (error.code === "ECONNABORTED") {
        enhancedError.message = "The request timed out. Please try again.";
      } else {
        enhancedError.message =
          "Unable to connect to the server. Please check your internet connection.";
      }

      console.error("Network error:", {
        url: error.config?.url,
        method: error.config?.method,
        message: enhancedError.message,
        code: error.code,
      });
    } else {
      // Request setup error
      enhancedError.message =
        "An unexpected error occurred while making the request.";
      console.error("Request setup error:", error.message);
    }

    return Promise.reject(enhancedError);
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
