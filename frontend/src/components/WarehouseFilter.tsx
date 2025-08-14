import React, { useEffect, useState } from "react";
import { ChevronDown, MapPin, Building, Check } from "lucide-react";
import {
  useWarehouseFilter,
  useWarehouseList,
  useSelectedWarehouse,
} from "../contexts/WarehouseFilterContext";
import { useWarehouses } from "../hooks/useApi";
import LoadingSpinner from "./LoadingSpinner";

interface WarehouseFilterProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  disabled?: boolean;
}

const WarehouseFilter: React.FC<WarehouseFilterProps> = ({
  className = "",
  size = "md",
  showLabel = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { selectWarehouse, clearFilter } = useWarehouseFilter();
  const { selectedWarehouse, isAllWarehouses } = useSelectedWarehouse();
  const { warehouses, setWarehouses, setLoading, setError } =
    useWarehouseList();

  // Fetch warehouses using the API hook
  const { data: warehousesData, isLoading, error } = useWarehouses();

  // Update context when API data changes
  useEffect(() => {
    if (warehousesData?.warehouses) {
      setWarehouses(warehousesData.warehouses);
    }
  }, [warehousesData, setWarehouses]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    setError(error?.message || null);
  }, [error, setError]);

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleWarehouseSelect = (warehouse: any) => {
    if (warehouse === null) {
      clearFilter();
    } else {
      selectWarehouse(warehouse);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-warehouse-filter]")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  const displayText = isAllWarehouses
    ? "All Warehouses"
    : selectedWarehouse?.name || "Select Warehouse";
  const displayIcon = isAllWarehouses ? Building : MapPin;
  const DisplayIcon = displayIcon;

  return (
    <div className={`relative ${className}`} data-warehouse-filter>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Warehouse Filter
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled || isLoading}
          className={`
            relative w-full bg-white border border-gray-300 rounded-md shadow-sm
            ${sizeClasses[size]}
            ${
              disabled || isLoading
                ? "cursor-not-allowed bg-gray-50 text-gray-400"
                : "cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            }
            flex items-center justify-between
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center">
            <DisplayIcon className={`${iconSizes[size]} text-gray-400 mr-2`} />
            <span className="block truncate">
              {isLoading ? "Loading..." : displayText}
            </span>
          </div>

          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <ChevronDown
              className={`${
                iconSizes[size]
              } text-gray-400 transition-transform duration-200 ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && !isLoading && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {/* All Warehouses Option */}
            <button
              type="button"
              onClick={() => handleWarehouseSelect(null)}
              className={`
                w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between
                ${
                  isAllWarehouses ? "bg-blue-50 text-blue-700" : "text-gray-900"
                }
              `}
            >
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2 text-gray-400" />
                <span>All Warehouses</span>
              </div>
              {isAllWarehouses && <Check className="w-4 h-4 text-blue-600" />}
            </button>

            {/* Divider */}
            {warehouses.length > 0 && (
              <div className="border-t border-gray-200 my-1" />
            )}

            {/* Individual Warehouses */}
            {warehouses.map((warehouse) => (
              <button
                key={warehouse.id}
                type="button"
                onClick={() => handleWarehouseSelect(warehouse)}
                className={`
                  w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between
                  ${
                    selectedWarehouse?.id === warehouse.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-900"
                  }
                `}
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <div>
                    <div className="font-medium">{warehouse.name}</div>
                    {warehouse.address && (
                      <div className="text-xs text-gray-500 truncate">
                        {warehouse.address}
                      </div>
                    )}
                  </div>
                </div>
                {selectedWarehouse?.id === warehouse.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}

            {/* Empty State */}
            {warehouses.length === 0 && !isLoading && (
              <div className="px-3 py-2 text-gray-500 text-center">
                No warehouses available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <p className="mt-1 text-sm text-red-600">Failed to load warehouses</p>
      )}
    </div>
  );
};

export default WarehouseFilter;
