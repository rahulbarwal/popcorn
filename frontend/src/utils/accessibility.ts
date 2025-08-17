/**
 * Accessibility utilities and testing helpers
 */

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
} as const;

// ARIA roles and properties
export const ARIA_ROLES = {
  BUTTON: "button",
  LINK: "link",
  MENU: "menu",
  MENUITEM: "menuitem",
  TAB: "tab",
  TABPANEL: "tabpanel",
  DIALOG: "dialog",
  ALERT: "alert",
  STATUS: "status",
  REGION: "region",
  BANNER: "banner",
  MAIN: "main",
  NAVIGATION: "navigation",
  COMPLEMENTARY: "complementary",
  CONTENTINFO: "contentinfo",
  TABLE: "table",
  ROW: "row",
  CELL: "cell",
  COLUMNHEADER: "columnheader",
  ROWHEADER: "rowheader",
  LIST: "list",
  LISTITEM: "listitem",
  GROUP: "group",
  RADIOGROUP: "radiogroup",
  RADIO: "radio",
  CHECKBOX: "checkbox",
  TEXTBOX: "textbox",
  COMBOBOX: "combobox",
  LISTBOX: "listbox",
  OPTION: "option",
  PROGRESSBAR: "progressbar",
  SLIDER: "slider",
  SPINBUTTON: "spinbutton",
  SWITCH: "switch",
  TREE: "tree",
  TREEITEM: "treeitem",
} as const;

// Common accessibility attributes
export interface AccessibilityProps {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-expanded"?: boolean;
  "aria-selected"?: boolean;
  "aria-checked"?: boolean | "mixed";
  "aria-disabled"?: boolean;
  "aria-hidden"?: boolean;
  "aria-live"?: "off" | "polite" | "assertive";
  "aria-atomic"?: boolean;
  "aria-busy"?: boolean;
  "aria-controls"?: string;
  "aria-current"?: boolean | "page" | "step" | "location" | "date" | "time";
  "aria-haspopup"?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
  "aria-invalid"?: boolean | "grammar" | "spelling";
  "aria-level"?: number;
  "aria-modal"?: boolean;
  "aria-multiline"?: boolean;
  "aria-multiselectable"?: boolean;
  "aria-orientation"?: "horizontal" | "vertical";
  "aria-placeholder"?: string;
  "aria-pressed"?: boolean | "mixed";
  "aria-readonly"?: boolean;
  "aria-required"?: boolean;
  "aria-sort"?: "none" | "ascending" | "descending" | "other";
  "aria-valuemax"?: number;
  "aria-valuemin"?: number;
  "aria-valuenow"?: number;
  "aria-valuetext"?: string;
  role?: string;
  tabIndex?: number;
}

/**
 * Generate a unique ID for accessibility purposes
 */
export const generateId = (prefix: string = "a11y"): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if an element is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-disabled") === "true") return false;

  const tagName = element.tagName.toLowerCase();
  const focusableTags = ["input", "button", "select", "textarea", "a"];

  if (focusableTags.includes(tagName)) {
    return true;
  }

  if (element.tabIndex >= 0) {
    return true;
  }

  return false;
};

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([aria-disabled="true"])',
    '[role="link"]:not([aria-disabled="true"])',
    '[role="menuitem"]:not([aria-disabled="true"])',
    '[role="tab"]:not([aria-disabled="true"])',
  ].join(", ");

  const elements = Array.from(
    container.querySelectorAll(focusableSelectors)
  ) as HTMLElement[];
  return elements.filter(isFocusable);
};

/**
 * Trap focus within a container (useful for modals)
 */
export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== KEYBOARD_KEYS.TAB) return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener("keydown", handleKeyDown);

  // Focus the first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
};

/**
 * Announce text to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: "polite" | "assertive" = "polite"
): void => {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Check if user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia("(prefers-contrast: high)").matches;
};

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = (): boolean => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/**
 * Keyboard navigation handler for lists and menus
 */
export const createKeyboardNavigationHandler = (
  items: HTMLElement[],
  options: {
    orientation?: "horizontal" | "vertical";
    wrap?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) => {
  const { orientation = "vertical", wrap = true, onSelect } = options;
  let currentIndex = 0;

  const getNextIndex = (direction: "next" | "prev"): number => {
    if (direction === "next") {
      const nextIndex = currentIndex + 1;
      return wrap
        ? nextIndex % items.length
        : Math.min(nextIndex, items.length - 1);
    } else {
      const prevIndex = currentIndex - 1;
      return wrap
        ? (prevIndex + items.length) % items.length
        : Math.max(prevIndex, 0);
    }
  };

  const focusItem = (index: number) => {
    if (index >= 0 && index < items.length) {
      currentIndex = index;
      items[index].focus();
    }
  };

  return (event: KeyboardEvent) => {
    const { key } = event;

    switch (key) {
      case KEYBOARD_KEYS.ARROW_DOWN:
        if (orientation === "vertical") {
          event.preventDefault();
          focusItem(getNextIndex("next"));
        }
        break;

      case KEYBOARD_KEYS.ARROW_UP:
        if (orientation === "vertical") {
          event.preventDefault();
          focusItem(getNextIndex("prev"));
        }
        break;

      case KEYBOARD_KEYS.ARROW_RIGHT:
        if (orientation === "horizontal") {
          event.preventDefault();
          focusItem(getNextIndex("next"));
        }
        break;

      case KEYBOARD_KEYS.ARROW_LEFT:
        if (orientation === "horizontal") {
          event.preventDefault();
          focusItem(getNextIndex("prev"));
        }
        break;

      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        focusItem(0);
        break;

      case KEYBOARD_KEYS.END:
        event.preventDefault();
        focusItem(items.length - 1);
        break;

      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        event.preventDefault();
        onSelect?.(currentIndex);
        break;
    }
  };
};

/**
 * Accessibility testing utilities
 */
export const a11yTest = {
  /**
   * Check if element has accessible name
   */
  hasAccessibleName: (element: HTMLElement): boolean => {
    return !!(
      element.getAttribute("aria-label") ||
      element.getAttribute("aria-labelledby") ||
      element.textContent?.trim() ||
      (element as HTMLInputElement).labels?.length
    );
  },

  /**
   * Check if interactive element is keyboard accessible
   */
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const role = element.getAttribute("role");
    const tagName = element.tagName.toLowerCase();

    // Native interactive elements
    if (["button", "input", "select", "textarea", "a"].includes(tagName)) {
      return !element.hasAttribute("disabled");
    }

    // Elements with interactive roles
    if (role && ["button", "link", "menuitem", "tab"].includes(role)) {
      return (
        element.tabIndex >= 0 &&
        element.getAttribute("aria-disabled") !== "true"
      );
    }

    return false;
  },

  /**
   * Check if element has sufficient color contrast
   */
  hasSufficientContrast: (element: HTMLElement): boolean => {
    // This is a simplified check - in a real implementation,
    // you would calculate the actual contrast ratio
    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;

    // Basic check for transparent or same colors
    return backgroundColor !== color && backgroundColor !== "transparent";
  },

  /**
   * Check if form field has proper labeling
   */
  hasProperLabeling: (
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  ): boolean => {
    return !!(
      element.labels?.length ||
      element.getAttribute("aria-label") ||
      element.getAttribute("aria-labelledby") ||
      element.getAttribute("title")
    );
  },

  /**
   * Check if table has proper headers
   */
  hasProperTableHeaders: (table: HTMLTableElement): boolean => {
    const headers = table.querySelectorAll("th");
    const cells = table.querySelectorAll("td");

    if (headers.length === 0) return false;

    // Check if headers have scope attributes
    const headersWithScope = Array.from(headers).filter(
      (th) => th.hasAttribute("scope") || th.hasAttribute("id")
    );

    return headersWithScope.length > 0;
  },

  /**
   * Run basic accessibility audit on element
   */
  auditElement: (element: HTMLElement): string[] => {
    const issues: string[] = [];

    // Check for accessible name on interactive elements
    if (
      a11yTest.isKeyboardAccessible(element) &&
      !a11yTest.hasAccessibleName(element)
    ) {
      issues.push("Interactive element lacks accessible name");
    }

    // Check for keyboard accessibility
    const role = element.getAttribute("role");
    if (
      role &&
      ["button", "link"].includes(role) &&
      !a11yTest.isKeyboardAccessible(element)
    ) {
      issues.push("Interactive element is not keyboard accessible");
    }

    // Check form fields
    if (element.matches("input, select, textarea")) {
      if (!a11yTest.hasProperLabeling(element as HTMLInputElement)) {
        issues.push("Form field lacks proper labeling");
      }
    }

    // Check tables
    if (element.tagName.toLowerCase() === "table") {
      if (!a11yTest.hasProperTableHeaders(element as HTMLTableElement)) {
        issues.push("Table lacks proper headers");
      }
    }

    // Check for missing alt text on images
    if (
      element.tagName.toLowerCase() === "img" &&
      !element.hasAttribute("alt")
    ) {
      issues.push("Image lacks alt text");
    }

    return issues;
  },
};

/**
 * Create accessible sort button for tables
 */
export const createSortButton = (
  label: string,
  currentSort?: { field: string; direction: "asc" | "desc" },
  field?: string
): AccessibilityProps => {
  const isActive = currentSort?.field === field;
  const direction = isActive ? currentSort.direction : "none";

  let ariaLabel = `${label}, not sorted. Click to sort ascending.`;

  if (isActive) {
    ariaLabel = `${label}, currently sorted ${
      direction === "asc" ? "ascending" : "descending"
    }. Click to sort ${direction === "asc" ? "descending" : "ascending"}.`;
  }

  return {
    "aria-label": ariaLabel,
    "aria-sort":
      direction === "none"
        ? "none"
        : direction === "asc"
        ? "ascending"
        : "descending",
    role: "button",
    tabIndex: 0,
  };
};

/**
 * Create accessible modal props
 */
export const createModalProps = (
  titleId: string,
  descriptionId?: string
): AccessibilityProps => {
  return {
    role: "dialog",
    "aria-modal": true,
    "aria-labelledby": titleId,
    "aria-describedby": descriptionId,
    tabIndex: -1,
  };
};

/**
 * Create accessible combobox props
 */
export const createComboboxProps = (
  listboxId: string,
  expanded: boolean,
  activeDescendant?: string
): AccessibilityProps => {
  return {
    role: "combobox",
    "aria-expanded": expanded,
    "aria-controls": listboxId,
    "aria-activedescendant": activeDescendant,
    "aria-autocomplete": "list",
  };
};
