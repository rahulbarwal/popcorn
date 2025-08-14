import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Warehouse } from "../types/api";

// Types
export interface WarehouseFilterState {
  selectedWarehouseId: number | null;
  selectedWarehouse: Warehouse | null;
  warehouses: Warehouse[];
  isLoading: boolean;
  error: string | null;
}

export type WarehouseFilterAction =
  | { type: "SET_WAREHOUSES"; payload: Warehouse[] }
  | {
      type: "SET_SELECTED_WAREHOUSE";
      payload: { id: number | null; warehouse: Warehouse | null };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_FILTER" };

// Initial state
const initialState: WarehouseFilterState = {
  selectedWarehouseId: null,
  selectedWarehouse: null,
  warehouses: [],
  isLoading: false,
  error: null,
};

// Reducer
function warehouseFilterReducer(
  state: WarehouseFilterState,
  action: WarehouseFilterAction
): WarehouseFilterState {
  switch (action.type) {
    case "SET_WAREHOUSES":
      return {
        ...state,
        warehouses: action.payload,
        error: null,
      };

    case "SET_SELECTED_WAREHOUSE":
      return {
        ...state,
        selectedWarehouseId: action.payload.id,
        selectedWarehouse: action.payload.warehouse,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case "CLEAR_FILTER":
      return {
        ...state,
        selectedWarehouseId: null,
        selectedWarehouse: null,
      };

    default:
      return state;
  }
}

// Context
const WarehouseFilterContext = createContext<{
  state: WarehouseFilterState;
  dispatch: React.Dispatch<WarehouseFilterAction>;
  selectWarehouse: (warehouse: Warehouse | null) => void;
  clearFilter: () => void;
  isAllWarehouses: boolean;
} | null>(null);

// Provider component
interface WarehouseFilterProviderProps {
  children: ReactNode;
}

export const WarehouseFilterProvider: React.FC<
  WarehouseFilterProviderProps
> = ({ children }) => {
  const [state, dispatch] = useReducer(warehouseFilterReducer, initialState);
  const [persistedWarehouseId, setPersistedWarehouseId] = useLocalStorage<
    number | null
  >("selectedWarehouseId", null);

  // Load persisted warehouse selection on mount
  useEffect(() => {
    if (persistedWarehouseId && state.warehouses.length > 0) {
      const warehouse = state.warehouses.find(
        (w) => w.id === persistedWarehouseId
      );
      if (warehouse) {
        dispatch({
          type: "SET_SELECTED_WAREHOUSE",
          payload: { id: warehouse.id, warehouse },
        });
      }
    }
  }, [persistedWarehouseId, state.warehouses]);

  // Helper functions
  const selectWarehouse = (warehouse: Warehouse | null) => {
    const id = warehouse?.id || null;
    dispatch({
      type: "SET_SELECTED_WAREHOUSE",
      payload: { id, warehouse },
    });
    setPersistedWarehouseId(id);
  };

  const clearFilter = () => {
    dispatch({ type: "CLEAR_FILTER" });
    setPersistedWarehouseId(null);
  };

  const isAllWarehouses = state.selectedWarehouseId === null;

  return (
    <WarehouseFilterContext.Provider
      value={{
        state,
        dispatch,
        selectWarehouse,
        clearFilter,
        isAllWarehouses,
      }}
    >
      {children}
    </WarehouseFilterContext.Provider>
  );
};

// Custom hook to use the context
export const useWarehouseFilter = () => {
  const context = useContext(WarehouseFilterContext);
  if (!context) {
    throw new Error(
      "useWarehouseFilter must be used within a WarehouseFilterProvider"
    );
  }
  return context;
};

// Helper hooks for specific functionality
export const useSelectedWarehouse = () => {
  const { state } = useWarehouseFilter();
  return {
    selectedWarehouse: state.selectedWarehouse,
    selectedWarehouseId: state.selectedWarehouseId,
    isAllWarehouses: state.selectedWarehouseId === null,
  };
};

export const useWarehouseList = () => {
  const { state, dispatch } = useWarehouseFilter();

  const setWarehouses = (warehouses: Warehouse[]) => {
    dispatch({ type: "SET_WAREHOUSES", payload: warehouses });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  };

  return {
    warehouses: state.warehouses,
    isLoading: state.isLoading,
    error: state.error,
    setWarehouses,
    setLoading,
    setError,
  };
};
