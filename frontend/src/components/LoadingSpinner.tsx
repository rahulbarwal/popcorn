import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  ariaLabel?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
  className = "",
  ariaLabel,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const loadingText = text || "Loading";
  const accessibleLabel = ariaLabel || loadingText;

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={accessibleLabel}
    >
      <div className="flex flex-col items-center space-y-2">
        <Loader2
          className={`animate-spin text-blue-600 ${sizeClasses[size]}`}
          aria-hidden="true"
        />
        {text && (
          <p className="text-sm text-gray-600" aria-hidden="true">
            {text}
          </p>
        )}
        <span className="sr-only">{accessibleLabel}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
