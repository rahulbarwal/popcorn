import React, { createContext, useContext, useReducer, ReactNode } from "react";

// Types for the global state
export interface AppState {
  user: {
    id: string | null;
    name: string | null;
    role: string | null;
  };
  notifications: Notification[];
  loading: {
    global: boolean;
    components: Record<string, boolean>;
  };
  errors: {
    global: string | null;
    components: Record<string, string | null>;
  };
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  timestamp: number;
  autoClose?: boolean;
}

// Action types
export type AppAction =
  | { type: "SET_USER"; payload: AppState["user"] }
  | {
      type: "ADD_NOTIFICATION";
      payload: Omit<Notification, "id" | "timestamp">;
    }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "SET_GLOBAL_LOADING"; payload: boolean }
  | {
      type: "SET_COMPONENT_LOADING";
      payload: { component: string; loading: boolean };
    }
  | { type: "SET_GLOBAL_ERROR"; payload: string | null }
  | {
      type: "SET_COMPONENT_ERROR";
      payload: { component: string; error: string | null };
    }
  | { type: "CLEAR_ALL_ERRORS" };

// Initial state
const initialState: AppState = {
  user: {
    id: null,
    name: null,
    role: null,
  },
  notifications: [],
  loading: {
    global: false,
    components: {},
  },
  errors: {
    global: null,
    components: {},
  },
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
      };

    case "ADD_NOTIFICATION":
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      return {
        ...state,
        notifications: [...state.notifications, notification],
      };

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload
        ),
      };

    case "SET_GLOBAL_LOADING":
      return {
        ...state,
        loading: {
          ...state.loading,
          global: action.payload,
        },
      };

    case "SET_COMPONENT_LOADING":
      return {
        ...state,
        loading: {
          ...state.loading,
          components: {
            ...state.loading.components,
            [action.payload.component]: action.payload.loading,
          },
        },
      };

    case "SET_GLOBAL_ERROR":
      return {
        ...state,
        errors: {
          ...state.errors,
          global: action.payload,
        },
      };

    case "SET_COMPONENT_ERROR":
      return {
        ...state,
        errors: {
          ...state.errors,
          components: {
            ...state.errors.components,
            [action.payload.component]: action.payload.error,
          },
        },
      };

    case "CLEAR_ALL_ERRORS":
      return {
        ...state,
        errors: {
          global: null,
          components: {},
        },
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

// Helper hooks for specific parts of the state
export const useNotifications = () => {
  const { state, dispatch } = useAppContext();

  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp">
  ) => {
    dispatch({ type: "ADD_NOTIFICATION", payload: notification });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  };

  return {
    notifications: state.notifications,
    addNotification,
    removeNotification,
  };
};

export const useLoading = () => {
  const { state, dispatch } = useAppContext();

  const setGlobalLoading = (loading: boolean) => {
    dispatch({ type: "SET_GLOBAL_LOADING", payload: loading });
  };

  const setComponentLoading = (component: string, loading: boolean) => {
    dispatch({
      type: "SET_COMPONENT_LOADING",
      payload: { component, loading },
    });
  };

  return {
    globalLoading: state.loading.global,
    componentLoading: state.loading.components,
    setGlobalLoading,
    setComponentLoading,
  };
};

export const useErrors = () => {
  const { state, dispatch } = useAppContext();

  const setGlobalError = (error: string | null) => {
    dispatch({ type: "SET_GLOBAL_ERROR", payload: error });
  };

  const setComponentError = (component: string, error: string | null) => {
    dispatch({ type: "SET_COMPONENT_ERROR", payload: { component, error } });
  };

  const clearAllErrors = () => {
    dispatch({ type: "CLEAR_ALL_ERRORS" });
  };

  return {
    globalError: state.errors.global,
    componentErrors: state.errors.components,
    setGlobalError,
    setComponentError,
    clearAllErrors,
  };
};
