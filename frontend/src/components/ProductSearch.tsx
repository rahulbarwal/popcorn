import React, { useState, useEffect, useRef } from "react";
import { Search, X, Clock, Package } from "lucide-react";
import { useDebouncedSearch } from "../hooks/useDebounce";
import { useProducts } from "../hooks/useApi";
import { Product } from "../types/api";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  onProductSelect?: (product: Product) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  className?: string;
  disabled?: boolean;
}

interface SearchSuggestion {
  type: "product" | "category" | "sku";
  value: string;
  label: string;
  product?: Product;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  value,
  onChange,
  onProductSelect,
  placeholder = "Search products by name, SKU, or category...",
  showSuggestions = true,
  className = "",
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { debouncedSearchValue } = useDebouncedSearch(value, 300);

  // Fetch products for suggestions when search value changes
  const shouldFetchSuggestions =
    showSuggestions && debouncedSearchValue.length >= 2;
  const { data: searchResults } = useProducts(
    shouldFetchSuggestions
      ? {
          search: debouncedSearchValue,
          limit: 10, // Limit suggestions to 10 items
        }
      : {}
  );

  // Generate suggestions from search results
  useEffect(() => {
    if (
      !showSuggestions ||
      !searchResults?.products ||
      debouncedSearchValue.length < 2
    ) {
      setSuggestions([]);
      return;
    }

    const newSuggestions: SearchSuggestion[] = [];
    const addedValues = new Set<string>();

    // Add product name suggestions
    searchResults.products.forEach((product) => {
      if (
        product.name.toLowerCase().includes(debouncedSearchValue.toLowerCase())
      ) {
        const suggestion: SearchSuggestion = {
          type: "product",
          value: product.name,
          label: product.name,
          product,
        };
        if (!addedValues.has(suggestion.value.toLowerCase())) {
          newSuggestions.push(suggestion);
          addedValues.add(suggestion.value.toLowerCase());
        }
      }
    });

    // Add SKU suggestions
    searchResults.products.forEach((product) => {
      if (
        product.sku.toLowerCase().includes(debouncedSearchValue.toLowerCase())
      ) {
        const suggestion: SearchSuggestion = {
          type: "sku",
          value: product.sku,
          label: `${product.sku} - ${product.name}`,
          product,
        };
        if (!addedValues.has(suggestion.value.toLowerCase())) {
          newSuggestions.push(suggestion);
          addedValues.add(suggestion.value.toLowerCase());
        }
      }
    });

    // Add category suggestions
    const categories = new Set<string>();
    searchResults.products.forEach((product) => {
      if (
        product.category
          .toLowerCase()
          .includes(debouncedSearchValue.toLowerCase())
      ) {
        categories.add(product.category);
      }
    });

    categories.forEach((category) => {
      const suggestion: SearchSuggestion = {
        type: "category",
        value: category,
        label: `Category: ${category}`,
      };
      if (!addedValues.has(suggestion.value.toLowerCase())) {
        newSuggestions.push(suggestion);
        addedValues.add(suggestion.value.toLowerCase());
      }
    });

    setSuggestions(newSuggestions.slice(0, 8)); // Limit to 8 suggestions
    setSelectedIndex(-1);
  }, [searchResults, debouncedSearchValue, showSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setIsFocused(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.value);
    setIsFocused(false);
    setSelectedIndex(-1);

    if (suggestion.product && onProductSelect) {
      onProductSelect(suggestion.product);
    }
  };

  const handleClearSearch = () => {
    onChange("");
    setIsFocused(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsFocused(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "product":
        return <Package className="w-4 h-4 text-blue-500" />;
      case "sku":
        return <Search className="w-4 h-4 text-green-500" />;
      case "category":
        return <Clock className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 text-yellow-900 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const showSuggestionsList =
    showSuggestions && isFocused && suggestions.length > 0;

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="product-search" className="sr-only">
        {placeholder}
      </label>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          id="product-search"
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`form-input pl-10 ${value ? "pr-10" : ""} ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-expanded={showSuggestionsList}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-describedby="search-help"
          role="combobox"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Help Text */}
      <div id="search-help" className="sr-only">
        Search for products by name, SKU, or category. Use arrow keys to
        navigate suggestions, Enter to select, Escape to close.
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.value}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? "bg-blue-50 border-blue-200" : ""
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-center space-x-3">
                {getSuggestionIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {highlightMatch(suggestion.label, debouncedSearchValue)}
                  </div>
                  {suggestion.product && (
                    <div className="text-xs text-gray-500 mt-1">
                      SKU: {suggestion.product.sku} •{" "}
                      {suggestion.product.category}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}

          {debouncedSearchValue.length >= 2 && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No products found matching "{debouncedSearchValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
