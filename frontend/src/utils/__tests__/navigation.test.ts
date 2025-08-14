import { describe, it, expect, vi } from "vitest";
import { NavigateFunction } from "react-router-dom";
import {
  navigateToMetricDetails,
  getMetricNavigationLabel,
  getMetricDescription,
} from "../navigation";

describe("navigation utilities", () => {
  describe("navigateToMetricDetails", () => {
    it("navigates to products page for total_products metric", () => {
      const mockNavigate = vi.fn() as NavigateFunction;

      navigateToMetricDetails(mockNavigate, "total_products");

      expect(mockNavigate).toHaveBeenCalledWith("/products");
    });

    it("navigates to products page with low stock filter for low_stock metric", () => {
      const mockNavigate = vi.fn() as NavigateFunction;

      navigateToMetricDetails(mockNavigate, "low_stock");

      expect(mockNavigate).toHaveBeenCalledWith(
        "/products?stock_filter=low_stock"
      );
    });

    it("navigates to products page with out of stock filter for out_of_stock metric", () => {
      const mockNavigate = vi.fn() as NavigateFunction;

      navigateToMetricDetails(mockNavigate, "out_of_stock");

      expect(mockNavigate).toHaveBeenCalledWith(
        "/products?stock_filter=out_of_stock"
      );
    });

    it("navigates to products page with value sorting for total_stock_value metric", () => {
      const mockNavigate = vi.fn() as NavigateFunction;

      navigateToMetricDetails(mockNavigate, "total_stock_value");

      expect(mockNavigate).toHaveBeenCalledWith(
        "/products?sort_by=total_value&sort_order=desc"
      );
    });

    it("includes warehouse filter in navigation", () => {
      const mockNavigate = vi.fn() as NavigateFunction;

      navigateToMetricDetails(mockNavigate, "total_products", {
        warehouse_id: 1,
      });

      expect(mockNavigate).toHaveBeenCalledWith("/products?warehouse_id=1");
    });

    it("combines multiple filters correctly", () => {
      const mockNavigate = vi.fn() as NavigateFunction;

      navigateToMetricDetails(mockNavigate, "low_stock", {
        warehouse_id: 1,
        search: "test",
        category: "electronics",
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        "/products?warehouse_id=1&search=test&category=electronics&stock_filter=low_stock"
      );
    });

    it("ignores undefined and empty values in options", () => {
      const mockNavigate = vi.fn() as NavigateFunction;

      navigateToMetricDetails(mockNavigate, "total_products", {
        warehouse_id: 1,
        search: "",
        category: undefined,
      });

      expect(mockNavigate).toHaveBeenCalledWith("/products?warehouse_id=1");
    });

    it("logs warning for unknown metric types", () => {
      const mockNavigate = vi.fn() as NavigateFunction;
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      navigateToMetricDetails(mockNavigate, "unknown_metric");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unknown metric type: unknown_metric"
      );
      expect(mockNavigate).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("logs message for suppliers metric (future implementation)", () => {
      const mockNavigate = vi.fn() as NavigateFunction;
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      navigateToMetricDetails(mockNavigate, "suppliers");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Suppliers page navigation - to be implemented"
      );
      expect(mockNavigate).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("getMetricNavigationLabel", () => {
    it("returns correct labels for all metric types", () => {
      expect(getMetricNavigationLabel("total_products")).toBe(
        "View all products"
      );
      expect(getMetricNavigationLabel("low_stock")).toBe(
        "View low stock products"
      );
      expect(getMetricNavigationLabel("out_of_stock")).toBe(
        "View out of stock products"
      );
      expect(getMetricNavigationLabel("suppliers")).toBe("View suppliers");
      expect(getMetricNavigationLabel("total_stock_value")).toBe(
        "View products by value"
      );
    });

    it("returns default label for unknown metric types", () => {
      expect(getMetricNavigationLabel("unknown_metric")).toBe("View details");
    });
  });

  describe("getMetricDescription", () => {
    it("returns correct descriptions for all metric types", () => {
      expect(getMetricDescription("total_products")).toBe(
        "Total number of active products in inventory"
      );
      expect(getMetricDescription("low_stock")).toBe(
        "Products below their reorder point threshold"
      );
      expect(getMetricDescription("out_of_stock")).toBe(
        "Products with zero quantity across all locations"
      );
      expect(getMetricDescription("suppliers")).toBe(
        "Active suppliers in the system"
      );
      expect(getMetricDescription("total_stock_value")).toBe(
        "Total monetary value of current inventory"
      );
    });

    it("returns empty string for unknown metric types", () => {
      expect(getMetricDescription("unknown_metric")).toBe("");
    });
  });
});
