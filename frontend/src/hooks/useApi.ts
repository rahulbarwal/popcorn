import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { api, ApiError } from "../services/api";
import {
  useNotifications,
  useLoading,
  useErrors,
} from "../contexts/AppContext";
import {
  SummaryMetricsResponse,
  StockLevelsResponse,
  RecentPurchasesResponse,
  WarehouseDistributionResponse,
  StockVisualizationResponse,
  ReorderSuggestionsResponse,
  Product,
  PurchaseOrder,
  Supplier,
  Warehouse,
  CreateProductRequest,
  UpdateProductRequest,
  CreatePurchaseOrderRequest,
  SearchFilters,
  FilterOptions,
  InlineEditRequest,
  InlineEditResponse,
  BulkFieldUpdateRequest,
} from "../types/api";

// Query Keys
export const queryKeys = {
  summaryMetrics: (warehouseId?: number) => ["summaryMetrics", warehouseId],
  stockLevels: (filters: SearchFilters) => ["stockLevels", filters],
  recentPurchases: (warehouseId?: number) => ["recentPurchases", warehouseId],
  warehouseDistribution: (warehouseId?: number) => [
    "warehouseDistribution",
    warehouseId,
  ],
  stockVisualization: (warehouseId?: number) => [
    "stockVisualization",
    warehouseId,
  ],
  reorderSuggestions: (warehouseId?: number) => [
    "reorderSuggestions",
    warehouseId,
  ],
  products: (filters: SearchFilters) => ["products", filters],
  product: (id: number) => ["product", id],
  suppliers: () => ["suppliers"],
  warehouses: () => ["warehouses"],
  filterOptions: () => ["filterOptions"],
};

// Dashboard Hooks
export const useSummaryMetrics = (warehouseId?: number) => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.summaryMetrics(warehouseId),
    queryFn: () =>
      api.get<SummaryMetricsResponse>(
        `/api/dashboard/summary-metrics${
          warehouseId ? `?warehouse_id=${warehouseId}` : ""
        }`
      ),
    onError: (error: ApiError) => {
      setComponentError("summaryMetrics", error.message);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useStockLevels = (filters: SearchFilters = {}) => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.stockLevels(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
      return api.get<StockLevelsResponse>(
        `/api/dashboard/stock-levels?${params.toString()}`
      );
    },
    onError: (error: ApiError) => {
      setComponentError("stockLevels", error.message);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useRecentPurchases = (warehouseId?: number) => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.recentPurchases(warehouseId),
    queryFn: () =>
      api.get<RecentPurchasesResponse>(
        `/api/dashboard/recent-purchases${
          warehouseId ? `?warehouse_id=${warehouseId}` : ""
        }`
      ),
    onError: (error: ApiError) => {
      setComponentError("recentPurchases", error.message);
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useWarehouseDistribution = (warehouseId?: number) => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.warehouseDistribution(warehouseId),
    queryFn: () =>
      api.get<WarehouseDistributionResponse>(
        `/api/dashboard/warehouse-distribution${
          warehouseId ? `?warehouse_id=${warehouseId}` : ""
        }`
      ),
    onError: (error: ApiError) => {
      setComponentError("warehouseDistribution", error.message);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStockVisualization = (warehouseId?: number) => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.stockVisualization(warehouseId),
    queryFn: () =>
      api.get<StockVisualizationResponse>(
        `/api/dashboard/stock-visualization${
          warehouseId ? `?warehouse_id=${warehouseId}` : ""
        }`
      ),
    onError: (error: ApiError) => {
      setComponentError("stockVisualization", error.message);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useReorderSuggestions = (warehouseId?: number) => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.reorderSuggestions(warehouseId),
    queryFn: () =>
      api.get<ReorderSuggestionsResponse>(
        `/api/replenishment/suggestions${
          warehouseId ? `?warehouse_id=${warehouseId}` : ""
        }`
      ),
    onError: (error: ApiError) => {
      setComponentError("reorderSuggestions", error.message);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Product Management Hooks
export const useProducts = (filters: SearchFilters = {}) => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
      return api.get<StockLevelsResponse>(`/api/products?${params.toString()}`);
    },
    onError: (error: ApiError) => {
      setComponentError("products", error.message);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useProduct = (id: number) => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => api.get<Product>(`/api/products/${id}`),
    onError: (error: ApiError) => {
      setComponentError("product", error.message);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSuppliers = () => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.suppliers(),
    queryFn: () => api.get<{ suppliers: Supplier[] }>("/api/suppliers"),
    onError: (error: ApiError) => {
      setComponentError("suppliers", error.message);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useWarehouses = () => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.warehouses(),
    queryFn: () => api.get<{ warehouses: Warehouse[] }>("/api/warehouses"),
    onError: (error: ApiError) => {
      setComponentError("warehouses", error.message);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useFilterOptions = () => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: queryKeys.filterOptions(),
    queryFn: () => api.get<FilterOptions>("/api/dashboard/filter-options"),
    onError: (error: ApiError) => {
      setComponentError("filterOptions", error.message);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCategories = () => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<{ categories: string[] }>("/api/products/categories"),
    onError: (error: ApiError) => {
      setComponentError("categories", error.message);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation Hooks
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const { setComponentError } = useErrors();

  return useMutation({
    mutationFn: (data: CreateProductRequest) =>
      api.post<Product>("/api/products", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["summaryMetrics"] });
      addNotification({
        type: "success",
        message: `Product "${data.name}" created successfully`,
      });
    },
    onError: (error: ApiError) => {
      setComponentError("createProduct", error.message);
      addNotification({
        type: "error",
        message: error.message || "Failed to create product",
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const { setComponentError } = useErrors();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRequest }) =>
      api.put<Product>(`/api/products/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", data.id] });
      queryClient.invalidateQueries({ queryKey: ["summaryMetrics"] });
      addNotification({
        type: "success",
        message: `Product "${data.name}" updated successfully`,
      });
    },
    onError: (error: ApiError) => {
      setComponentError("updateProduct", error.message);
      addNotification({
        type: "error",
        message: error.message || "Failed to update product",
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const { setComponentError } = useErrors();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/products/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.removeQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["summaryMetrics"] });
      addNotification({
        type: "success",
        message: "Product deleted successfully",
      });
    },
    onError: (error: ApiError) => {
      setComponentError("deleteProduct", error.message);
      addNotification({
        type: "error",
        message: error.message || "Failed to delete product",
      });
    },
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const { setComponentError } = useErrors();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest) =>
      api.post<PurchaseOrder>("/api/purchase-orders", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recentPurchases"] });
      queryClient.invalidateQueries({ queryKey: ["reorderSuggestions"] });
      addNotification({
        type: "success",
        message: `Purchase order ${data.po_number} created successfully`,
      });
    },
    onError: (error: ApiError) => {
      setComponentError("createPurchaseOrder", error.message);
      addNotification({
        type: "error",
        message: error.message || "Failed to create purchase order",
      });
    },
  });
};

export const useInlineEdit = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const { setComponentError } = useErrors();

  return useMutation({
    mutationFn: (data: InlineEditRequest) =>
      api.patch<InlineEditResponse>(
        `/api/products/${data.product_id}/inline`,
        data
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", data.product.id] });
      if (data.affected_metrics.total_stock_value !== undefined) {
        queryClient.invalidateQueries({ queryKey: ["summaryMetrics"] });
      }
      if (data.affected_metrics.stock_status_changed) {
        queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
        queryClient.invalidateQueries({ queryKey: ["stockVisualization"] });
      }
      addNotification({
        type: "success",
        message: data.message,
      });
    },
    onError: (error: ApiError) => {
      setComponentError("inlineEdit", error.message);
      addNotification({
        type: "error",
        message: error.message || "Failed to update product",
      });
    },
  });
};

export const useBulkFieldUpdate = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const { setComponentError } = useErrors();

  return useMutation({
    mutationFn: (data: BulkFieldUpdateRequest) =>
      api.put<InlineEditResponse>(
        `/api/products/${data.product_id}/fields`,
        data
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", data.product.id] });
      queryClient.invalidateQueries({ queryKey: ["summaryMetrics"] });
      if (data.affected_metrics.stock_status_changed) {
        queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
        queryClient.invalidateQueries({ queryKey: ["stockVisualization"] });
      }
      addNotification({
        type: "success",
        message: data.message,
      });
    },
    onError: (error: ApiError) => {
      setComponentError("bulkFieldUpdate", error.message);
      addNotification({
        type: "error",
        message: error.message || "Failed to update product",
      });
    },
  });
};

// Generic hook for custom queries
export const useCustomQuery = <T>(
  key: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, ApiError>, "queryKey" | "queryFn">
) => {
  const { setComponentError } = useErrors();

  return useQuery({
    queryKey: key,
    queryFn,
    onError: (error: ApiError) => {
      setComponentError(key.join("_"), error.message);
    },
    ...options,
  });
};

// Generic hook for custom mutations
export const useCustomMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, ApiError, TVariables>
) => {
  const { addNotification } = useNotifications();
  const { setComponentError } = useErrors();

  return useMutation({
    mutationFn,
    onError: (error: ApiError) => {
      setComponentError("customMutation", error.message);
      addNotification({
        type: "error",
        message: error.message || "Operation failed",
      });
    },
    ...options,
  });
};
