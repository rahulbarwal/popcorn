import { NavigateFunction } from "react-router-dom";

export interface NavigationOptions {
  warehouse_id?: number;
  stock_filter?: string;
  search?: string;
  category?: string;
}

export const navigateToMetricDetails = (
  navigate: NavigateFunction,
  metric: string,
  options: NavigationOptions = {}
) => {
  const params = new URLSearchParams();

  // Add filter parameters
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const baseQuery = queryString ? `?${queryString}` : "";

  switch (metric) {
    case "total_products":
      // Navigate to products page
      navigate(`/products${baseQuery}`);
      break;

    case "low_stock":
      // Navigate to products page with low stock filter
      params.set("stock_filter", "low_stock");
      navigate(`/products?${params.toString()}`);
      break;

    case "out_of_stock":
      // Navigate to products page with out of stock filter
      params.set("stock_filter", "out_of_stock");
      navigate(`/products?${params.toString()}`);
      break;

    case "suppliers":
      // Navigate to suppliers page (future implementation)
      // For now, show notification
      console.log("Suppliers page navigation - to be implemented");
      break;

    case "total_stock_value":
      // Navigate to products page with value sorting
      params.set("sort_by", "total_value");
      params.set("sort_order", "desc");
      navigate(`/products?${params.toString()}`);
      break;

    default:
      console.warn(`Unknown metric type: ${metric}`);
  }
};

export const getMetricNavigationLabel = (metric: string): string => {
  switch (metric) {
    case "total_products":
      return "View all products";
    case "low_stock":
      return "View low stock products";
    case "out_of_stock":
      return "View out of stock products";
    case "suppliers":
      return "View suppliers";
    case "total_stock_value":
      return "View products by value";
    default:
      return "View details";
  }
};

export const getMetricDescription = (metric: string): string => {
  switch (metric) {
    case "total_products":
      return "Total number of active products in inventory";
    case "low_stock":
      return "Products below their reorder point threshold";
    case "out_of_stock":
      return "Products with zero quantity across all locations";
    case "suppliers":
      return "Active suppliers in the system";
    case "total_stock_value":
      return "Total monetary value of current inventory";
    default:
      return "";
  }
};
