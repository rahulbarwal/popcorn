import React, { useState, useEffect } from "react";
import { ChevronDown, MapPin, Building, Check } from "lucide-react";
import {
  useWarehouseFilter,
  useSelectedWarehouse,
} from "../contexts/WarehouseFilterContext";

interface WarehouseFilterCompactProps {
  className?: string;
}

const WarehouseFilterCompact: React.FC<WarehouseFilterCompactProps> = ({
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { state, selectWarehouse, clearFilter } = useWarehouseFilter();
  const { selectedWarehouse, isAllWarehouses } = useSelectedWarehouse();

  const handleWarehouseSelect = (warehouse: any) => {
    if (warehouse === null) {
      clearFilter();
    } else {
      selectWarehouse(warehouse);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-warehouse-filter-compact]")) {
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
    <div className={`relative ${className}`} data-warehouse-filter-compact>
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={state.isLoading}
        className="
          inline-flex items-center px-3 py-2 border border-gray-300 rounded-md
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <DisplayIcon className="w-4 h-4 mr-2 text-gray-400" />
        <span className="hidden sm:inline-block max-w-32 truncate">
          {state.isLoading ? "Loading..." : displayText}
        </span>
        <span className="sm:hidden">
          {isAllWarehouses
            ? "All"
            : selectedWarehouse?.name?.substring(0, 3) || "Select"}
        </span>
        <ChevronDown
          className={`ml-2 w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !state.isLoading && (
        <div className="absolute right-0 z-20 mt-2 w-64 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {/* All Warehouses Option */}
          <button
            type="button"
            onClick={() => handleWarehouseSelect(null)}
            className={`
              w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between
              ${isAllWarehouses ? "bg-blue-50 text-blue-700" : "text-gray-900"}
            `}
          >
            <div className="flex items-center">
              <Building className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">All Warehouses</span>
            </div>
            {isAllWarehouses && <Check className="w-4 h-4 text-blue-600" />}
          </button>

          {/* Divider */}
          {state.warehouses.length > 0 && (
            <div className="border-t border-gray-200 my-1" />
          )}

          {/* Individual Warehouses */}
          {state.warehouses.map((warehouse) => (
            <button
              key={warehouse.id}
              type="button"
              onClick={() => handleWarehouseSelect(warehouse)}
              className={`
                w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between
                ${
                  selectedWarehouse?.id === warehouse.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-900"
                }
              `}
            >
              <div className="flex items-center min-w-0">
                <MapPin className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{warehouse.name}</div>
                  {warehouse.address && (
                    <div className="text-xs text-gray-500 truncate">
                      {warehouse.address}
                    </div>
                  )}
                </div>
              </div>
              {selectedWarehouse?.id === warehouse.id && (
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
              )}
            </button>
          ))}

          {/* Empty State */}
          {state.warehouses.length === 0 && !state.isLoading && (
            <div className="px-4 py-2 text-gray-500 text-center text-sm">
              No warehouses available
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="absolute right-0 z-20 mt-2 w-64 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">Failed to load warehouses</p>
        </div>
      )}
    </div>
  );
};

export default WarehouseFilterCompact;
