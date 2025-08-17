/**
 * Development accessibility utilities
 * This file provides tools for developers to test accessibility during development
 */

import { a11yDev, runAccessibilityAudit } from "./a11yAudit";

// Initialize accessibility development tools
export const initA11yDevTools = () => {
  if (process.env.NODE_ENV === "development") {
    // Add audit function to window for manual testing
    a11yDev.addToDevTools();

    // Log accessibility tips
    console.group("🔧 Accessibility Development Tools");
    console.log("• Run window.a11yAudit() to audit the current page");
    console.log("• Check browser console for accessibility warnings");
    console.log("• Use keyboard navigation to test focus management");
    console.log(
      "• Test with screen reader (VoiceOver on Mac, NVDA on Windows)"
    );
    console.log("• Verify color contrast meets WCAG standards");
    console.groupEnd();

    // Run initial audit after page load
    setTimeout(() => {
      console.log("🔍 Running initial accessibility audit...");
      runAccessibilityAudit();
    }, 2000);
  }
};

// Keyboard navigation helper
export const logKeyboardShortcuts = () => {
  if (process.env.NODE_ENV === "development") {
    console.group("⌨️ Keyboard Navigation Shortcuts");
    console.log("• Tab: Navigate to next focusable element");
    console.log("• Shift+Tab: Navigate to previous focusable element");
    console.log("• Enter/Space: Activate buttons and links");
    console.log("• Arrow keys: Navigate within components (tables, menus)");
    console.log("• Escape: Close modals and dropdowns");
    console.log("• Home/End: Jump to first/last item in lists");
    console.groupEnd();
  }
};

// Screen reader testing tips
export const logScreenReaderTips = () => {
  if (process.env.NODE_ENV === "development") {
    console.group("🔊 Screen Reader Testing Tips");
    console.log("• macOS: Enable VoiceOver with Cmd+F5");
    console.log("• Windows: Download NVDA (free) or use Narrator");
    console.log("• Navigate by headings: H key in screen readers");
    console.log("• Navigate by landmarks: D key for regions");
    console.log("• Navigate by forms: F key for form controls");
    console.log("• Listen for proper announcements of state changes");
    console.groupEnd();
  }
};

// Color contrast checker
export const checkColorContrast = (element: HTMLElement) => {
  if (process.env.NODE_ENV === "development") {
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;

    console.group(`🎨 Color Contrast Check for ${element.tagName}`);
    console.log(`Text color: ${color}`);
    console.log(`Background color: ${backgroundColor}`);
    console.log("Use a contrast checker tool to verify WCAG compliance:");
    console.log(
      "• WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/"
    );
    console.log(
      "• Colour Contrast Analyser: https://www.tpgi.com/color-contrast-checker/"
    );
    console.groupEnd();
  }
};

// Focus management helper
export const logFocusPath = () => {
  if (process.env.NODE_ENV === "development") {
    let focusPath: HTMLElement[] = [];

    const logFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      focusPath.push(target);

      console.log(
        `🎯 Focus: ${target.tagName}${target.id ? "#" + target.id : ""}${
          target.className ? "." + target.className.split(" ").join(".") : ""
        }`
      );

      // Log focus path every 5 elements
      if (focusPath.length % 5 === 0) {
        console.group("📍 Recent Focus Path");
        focusPath.slice(-5).forEach((el, index) => {
          console.log(`${index + 1}. ${el.tagName}${el.id ? "#" + el.id : ""}`);
        });
        console.groupEnd();
      }
    };

    document.addEventListener("focusin", logFocus);

    console.log(
      "👀 Focus tracking enabled. Tab through the interface to see focus path."
    );

    return () => {
      document.removeEventListener("focusin", logFocus);
      console.log("👋 Focus tracking disabled.");
    };
  }
};

// ARIA attributes validator
export const validateAriaAttributes = (
  container: HTMLElement = document.body
) => {
  if (process.env.NODE_ENV === "development") {
    const elementsWithAria = container.querySelectorAll(
      "[aria-label], [aria-labelledby], [aria-describedby], [role]"
    );

    console.group("🏷️ ARIA Attributes Validation");

    elementsWithAria.forEach((element) => {
      const el = element as HTMLElement;
      const ariaLabel = el.getAttribute("aria-label");
      const ariaLabelledby = el.getAttribute("aria-labelledby");
      const ariaDescribedby = el.getAttribute("aria-describedby");
      const role = el.getAttribute("role");

      console.group(`Element: ${el.tagName}${el.id ? "#" + el.id : ""}`);

      if (ariaLabel) {
        console.log(`✓ aria-label: "${ariaLabel}"`);
      }

      if (ariaLabelledby) {
        const labelElement = document.getElementById(ariaLabelledby);
        if (labelElement) {
          console.log(`✓ aria-labelledby: "${ariaLabelledby}" (found)`);
        } else {
          console.warn(
            `⚠️ aria-labelledby: "${ariaLabelledby}" (element not found)`
          );
        }
      }

      if (ariaDescribedby) {
        const descElement = document.getElementById(ariaDescribedby);
        if (descElement) {
          console.log(`✓ aria-describedby: "${ariaDescribedby}" (found)`);
        } else {
          console.warn(
            `⚠️ aria-describedby: "${ariaDescribedby}" (element not found)`
          );
        }
      }

      if (role) {
        console.log(`✓ role: "${role}"`);
      }

      console.groupEnd();
    });

    console.groupEnd();
  }
};

// Export all utilities
export const a11yDevUtils = {
  init: initA11yDevTools,
  audit: runAccessibilityAudit,
  keyboardShortcuts: logKeyboardShortcuts,
  screenReaderTips: logScreenReaderTips,
  checkContrast: checkColorContrast,
  trackFocus: logFocusPath,
  validateAria: validateAriaAttributes,
};
