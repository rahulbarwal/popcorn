import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import SummaryMetrics from "../SummaryMetrics";
import { WarehouseFilterProvider } from "../../contexts/WarehouseFilterContext";
import { AppProvider } from "../../contexts/AppContext";
import * as useApiHooks from "../../hooks/useApi";

// Mock the API hooks
vi.mock("../../hooks/useApi");

const mockUseSummaryMetrics = vi.mocked(useApiHooks.useSummaryMetrics);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <WarehouseFilterProvider>{children}</WarehouseFilterProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

describe("SummaryMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state correctly", () => {
    mockUseSummaryMetrics.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics />
      </TestWrapper>
    );

    expect(screen.getByText("Summary Metrics")).toBeInTheDocument();
    expect(screen.getAllByText("Loading...")).toHaveLength(5);
  });

  it("renders error state correctly", () => {
    mockUseSummaryMetrics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Failed to load metrics" },
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics />
      </TestWrapper>
    );

    expect(screen.getByText("Summary Metrics")).toBeInTheDocument();
    expect(screen.getAllByText("Failed to load metrics")).toHaveLength(5);
  });

  it("renders metrics data correctly", () => {
    const mockData = {
      metrics: {
        total_products: {
          value: 1250,
          status: "normal" as const,
        },
        low_stock: {
          value: 45,
          status: "warning" as const,
          threshold: 50,
        },
        out_of_stock: {
          value: 12,
          status: "critical" as const,
        },
        suppliers: {
          value: 28,
          status: "normal" as const,
        },
        total_stock_value: {
          value: 125000.5,
          currency: "USD",
          status: "normal" as const,
          excluded_products: 5,
        },
      },
      last_updated: "2024-12-08T10:30:00Z",
      warehouse_filter: {
        id: 1,
        name: "Main Warehouse",
      },
    };

    mockUseSummaryMetrics.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics />
      </TestWrapper>
    );

    // Check metric values
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("$125,001")).toBeInTheDocument();

    // Check metric titles (now showing click instructions for better UX)
    expect(
      screen.getByText("Click to view total products details")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Click to view low stock details")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Click to view out of_stock details")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Click to view suppliers details")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Click to view total stock_value details")
    ).toBeInTheDocument();

    // Check additional info
    expect(screen.getByText("Threshold: 50")).toBeInTheDocument();
    expect(screen.getByText("5 products excluded")).toBeInTheDocument();
    expect(
      screen.getByText("Showing metrics for: Main Warehouse")
    ).toBeInTheDocument();
  });

  it("handles metric card clicks", () => {
    const mockOnMetricClick = vi.fn();
    const mockData = {
      metrics: {
        total_products: {
          value: 1250,
          status: "normal" as const,
        },
        low_stock: {
          value: 45,
          status: "warning" as const,
        },
        out_of_stock: {
          value: 12,
          status: "critical" as const,
        },
        suppliers: {
          value: 28,
          status: "normal" as const,
        },
        total_stock_value: {
          value: 125000.5,
          currency: "USD",
          status: "normal" as const,
        },
      },
    };

    mockUseSummaryMetrics.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics onMetricClick={mockOnMetricClick} />
      </TestWrapper>
    );

    // Click on Total Products card
    const totalProductsCard = screen.getByText("1,250").closest(".card");
    fireEvent.click(totalProductsCard!);
    expect(mockOnMetricClick).toHaveBeenCalledWith("total_products");

    // Click on Low Stock card
    const lowStockCard = screen.getByText("45").closest(".card");
    fireEvent.click(lowStockCard!);
    expect(mockOnMetricClick).toHaveBeenCalledWith("low_stock");
  });

  it("handles refresh button click", () => {
    const mockRefetch = vi.fn();
    mockUseSummaryMetrics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics />
      </TestWrapper>
    );

    const refreshButton = screen.getByTitle("Refresh metrics");
    fireEvent.click(refreshButton);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("shows refresh button as disabled when refetching", () => {
    mockUseSummaryMetrics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: true,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics />
      </TestWrapper>
    );

    const refreshButton = screen.getByTitle("Refresh metrics");
    expect(refreshButton).toBeDisabled();
  });

  it("applies correct status styling", () => {
    const mockData = {
      metrics: {
        total_products: {
          value: 1250,
          status: "normal" as const,
        },
        low_stock: {
          value: 45,
          status: "warning" as const,
        },
        out_of_stock: {
          value: 12,
          status: "critical" as const,
        },
        suppliers: {
          value: 28,
          status: "normal" as const,
        },
        total_stock_value: {
          value: 125000.5,
          currency: "USD",
          status: "normal" as const,
        },
      },
    };

    mockUseSummaryMetrics.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics />
      </TestWrapper>
    );

    // Check that warning status applies yellow styling
    const lowStockCard = screen.getByText("45").closest(".card");
    expect(lowStockCard).toHaveClass("bg-yellow-50", "border-yellow-200");

    // Check that critical status applies red styling
    const outOfStockCard = screen.getByText("12").closest(".card");
    expect(outOfStockCard).toHaveClass("bg-red-50", "border-red-200");

    // Check that normal status applies blue styling
    const totalProductsCard = screen.getByText("1,250").closest(".card");
    expect(totalProductsCard).toHaveClass("bg-blue-50", "border-blue-200");
  });

  it("supports keyboard navigation", () => {
    const mockOnMetricClick = vi.fn();
    const mockData = {
      metrics: {
        total_products: {
          value: 1250,
          status: "normal" as const,
        },
        low_stock: {
          value: 45,
          status: "warning" as const,
        },
        out_of_stock: {
          value: 12,
          status: "critical" as const,
        },
        suppliers: {
          value: 28,
          status: "normal" as const,
        },
        total_stock_value: {
          value: 125000.5,
          currency: "USD",
          status: "normal" as const,
        },
      },
    };

    mockUseSummaryMetrics.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics onMetricClick={mockOnMetricClick} />
      </TestWrapper>
    );

    const totalProductsCard = screen.getByText("1,250").closest(".card");

    // Test Enter key
    fireEvent.keyDown(totalProductsCard!, { key: "Enter" });
    expect(mockOnMetricClick).toHaveBeenCalledWith("total_products");

    // Test Space key
    fireEvent.keyDown(totalProductsCard!, { key: " " });
    expect(mockOnMetricClick).toHaveBeenCalledTimes(2);
  });

  it("disables navigation when enableNavigation is false", () => {
    const mockOnMetricClick = vi.fn();
    const mockData = {
      metrics: {
        total_products: {
          value: 1250,
          status: "normal" as const,
        },
        low_stock: {
          value: 45,
          status: "warning" as const,
        },
        out_of_stock: {
          value: 12,
          status: "critical" as const,
        },
        suppliers: {
          value: 28,
          status: "normal" as const,
        },
        total_stock_value: {
          value: 125000.5,
          currency: "USD",
          status: "normal" as const,
        },
      },
    };

    mockUseSummaryMetrics.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics
          onMetricClick={mockOnMetricClick}
          enableNavigation={false}
        />
      </TestWrapper>
    );

    const totalProductsCard = screen
      .getByText("Total Products")
      .closest(".card");

    // Card should not have cursor-pointer class when navigation is disabled
    expect(totalProductsCard).not.toHaveClass("cursor-pointer");

    // Click should not trigger callback when navigation is disabled
    fireEvent.click(totalProductsCard!);
    expect(mockOnMetricClick).not.toHaveBeenCalled();
  });

  it("handles auto-refresh correctly", async () => {
    vi.useFakeTimers();
    const mockRefetch = vi.fn();

    mockUseSummaryMetrics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics autoRefresh={true} refreshInterval={5000} />
      </TestWrapper>
    );

    // Fast-forward time by 5 seconds
    vi.advanceTimersByTime(5000);

    expect(mockRefetch).toHaveBeenCalledTimes(1);

    // Fast-forward another 5 seconds
    vi.advanceTimersByTime(5000);

    expect(mockRefetch).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("does not auto-refresh when disabled", async () => {
    vi.useFakeTimers();
    const mockRefetch = vi.fn();

    mockUseSummaryMetrics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics autoRefresh={false} refreshInterval={1000} />
      </TestWrapper>
    );

    // Fast-forward time by 5 seconds
    vi.advanceTimersByTime(5000);

    // Should not have called refetch since auto-refresh is disabled
    expect(mockRefetch).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("formats currency correctly for different locales", () => {
    const mockData = {
      metrics: {
        total_products: { value: 1250, status: "normal" as const },
        low_stock: { value: 45, status: "warning" as const },
        out_of_stock: { value: 12, status: "critical" as const },
        suppliers: { value: 28, status: "normal" as const },
        total_stock_value: {
          value: 1234567.89,
          currency: "USD",
          status: "normal" as const,
        },
      },
    };

    mockUseSummaryMetrics.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics />
      </TestWrapper>
    );

    // Should format large numbers with commas and no decimals for currency
    expect(screen.getByText("$1,234,568")).toBeInTheDocument();
  });

  it("handles missing data gracefully", () => {
    mockUseSummaryMetrics.mockReturnValue({
      data: {
        metrics: {
          total_products: undefined,
          low_stock: undefined,
          out_of_stock: undefined,
          suppliers: undefined,
          total_stock_value: undefined,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);

    render(
      <TestWrapper>
        <SummaryMetrics />
      </TestWrapper>
    );

    // Should display dashes for missing data
    expect(screen.getAllByText("-")).toHaveLength(5);
  });
});
