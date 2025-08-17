import React, { useEffect, useRef } from "react";

// Skip link component for keyboard navigation
export const SkipLink: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {children}
    </a>
  );
};

// Accessible button component with proper ARIA attributes
interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Loading...",
  disabled,
  children,
  className = "",
  ...props
}) => {
  const baseClasses = "btn focus-visible:focus";
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
  };
  const sizeClasses = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading ? (
        <>
          <span className="sr-only">{loadingText}</span>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Accessible form input with proper labeling
interface AccessibleInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  showLabel?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helpText,
  showLabel = true,
  id,
  className = "",
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = helpText ? `${inputId}-help` : undefined;

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className={
          showLabel ? "block text-sm font-medium text-gray-700" : "sr-only"
        }
      >
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        className={`form-input ${
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
        } ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          [errorId, helpId].filter(Boolean).join(" ") || undefined
        }
      />
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible select component
interface AccessibleSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helpText?: string;
  showLabel?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  label,
  error,
  helpText,
  showLabel = true,
  options,
  id,
  className = "",
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const helpId = helpText ? `${selectId}-help` : undefined;

  return (
    <div className="space-y-1">
      <label
        htmlFor={selectId}
        className={
          showLabel ? "block text-sm font-medium text-gray-700" : "sr-only"
        }
      >
        {label}
      </label>
      <select
        {...props}
        id={selectId}
        className={`form-select ${
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
        } ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          [errorId, helpId].filter(Boolean).join(" ") || undefined
        }
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Focus management hook
export const useFocusManagement = () => {
  const focusRef = useRef<HTMLElement | null>(null);

  const setFocus = (element: HTMLElement | null) => {
    focusRef.current = element;
    if (element) {
      element.focus();
    }
  };

  const restoreFocus = () => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  };

  return { setFocus, restoreFocus };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  items: Array<{ id: string; element?: HTMLElement }>,
  onSelect?: (id: string) => void
) => {
  const currentIndex = useRef(0);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        currentIndex.current = Math.min(
          currentIndex.current + 1,
          items.length - 1
        );
        items[currentIndex.current].element?.focus();
        break;
      case "ArrowUp":
        event.preventDefault();
        currentIndex.current = Math.max(currentIndex.current - 1, 0);
        items[currentIndex.current].element?.focus();
        break;
      case "Home":
        event.preventDefault();
        currentIndex.current = 0;
        items[0].element?.focus();
        break;
      case "End":
        event.preventDefault();
        currentIndex.current = items.length - 1;
        items[items.length - 1].element?.focus();
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (onSelect) {
          onSelect(items[currentIndex.current].id);
        }
        break;
    }
  };

  return { handleKeyDown };
};

// Accessible table component
interface AccessibleTableProps {
  caption: string;
  headers: Array<{ key: string; label: string; sortable?: boolean }>;
  data: Array<Record<string, any>>;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  className?: string;
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  caption,
  headers,
  data,
  onSort,
  sortKey,
  sortDirection,
  className = "",
}) => {
  const handleSort = (key: string) => {
    if (!onSort) return;

    const newDirection =
      sortKey === key && sortDirection === "asc" ? "desc" : "asc";
    onSort(key, newDirection);
  };

  const getSortAriaLabel = (key: string, label: string) => {
    if (sortKey === key) {
      return `${label}, sorted ${
        sortDirection === "asc" ? "ascending" : "descending"
      }. Click to sort ${
        sortDirection === "asc" ? "descending" : "ascending"
      }.`;
    }
    return `${label}, not sorted. Click to sort ascending.`;
  };

  return (
    <div className={`table-responsive ${className}`}>
      <table className="min-w-full divide-y divide-gray-200" role="table">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-gray-50">
          <tr role="row">
            {headers.map((header) => (
              <th
                key={header.key}
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header.sortable ? (
                  <button
                    onClick={() => handleSort(header.key)}
                    className="group inline-flex items-center space-x-1 text-left font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    aria-label={getSortAriaLabel(header.key, header.label)}
                  >
                    <span>{header.label}</span>
                    <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-500">
                      {sortKey === header.key ? (
                        sortDirection === "asc" ? (
                          <svg
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )
                      ) : (
                        <svg
                          className="h-3 w-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" />
                        </svg>
                      )}
                    </span>
                  </button>
                ) : (
                  header.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} role="row">
              {headers.map((header) => (
                <td
                  key={header.key}
                  className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  data-label={header.label}
                >
                  {row[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Live region for announcements
interface LiveRegionProps {
  message: string;
  politeness?: "polite" | "assertive";
  clearAfter?: number;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = "polite",
  clearAfter = 5000,
}) => {
  const [currentMessage, setCurrentMessage] = React.useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage("");
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div aria-live={politeness} aria-atomic="true" className="sr-only">
      {currentMessage}
    </div>
  );
};

// Progress indicator for loading states
interface ProgressIndicatorProps {
  value?: number;
  max?: number;
  label: string;
  showValue?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
}) => {
  const percentage =
    value !== undefined ? Math.round((value / max) * 100) : undefined;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        {showValue && percentage !== undefined && (
          <span className="text-gray-500">{percentage}%</span>
        )}
      </div>
      <div
        className="w-full bg-gray-200 rounded-full h-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        {percentage !== undefined ? (
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        ) : (
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" />
        )}
      </div>
    </div>
  );
};
