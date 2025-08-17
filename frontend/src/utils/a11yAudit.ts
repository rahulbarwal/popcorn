/**
 * Accessibility audit utilities for automated testing
 */

import { a11yTest } from "./accessibility";

export interface AccessibilityIssue {
  element: HTMLElement;
  issue: string;
  severity: "error" | "warning" | "info";
  wcagLevel: "A" | "AA" | "AAA";
  description: string;
  suggestion: string;
}

export interface AccessibilityAuditResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Run comprehensive accessibility audit on a container
 */
export const auditAccessibility = (
  container: HTMLElement
): AccessibilityAuditResult => {
  const issues: AccessibilityIssue[] = [];

  // Get all elements to audit
  const allElements = container.querySelectorAll("*");

  allElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const elementIssues = auditElement(htmlElement);
    issues.push(...elementIssues);
  });

  // Calculate summary
  const summary = {
    total: issues.length,
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
  };

  return {
    passed: summary.errors === 0,
    issues,
    summary,
  };
};

/**
 * Audit individual element for accessibility issues
 */
const auditElement = (element: HTMLElement): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute("role");

  // Check for missing alt text on images
  if (tagName === "img" && !element.hasAttribute("alt")) {
    issues.push({
      element,
      issue: "missing-alt-text",
      severity: "error",
      wcagLevel: "A",
      description: "Image is missing alt text",
      suggestion:
        'Add alt attribute to describe the image content or use alt="" for decorative images',
    });
  }

  // Check for empty alt text on meaningful images
  if (
    tagName === "img" &&
    element.getAttribute("alt") === "" &&
    !element.hasAttribute("aria-hidden")
  ) {
    const hasParentLink = element.closest("a, button");
    if (!hasParentLink) {
      issues.push({
        element,
        issue: "empty-alt-meaningful-image",
        severity: "warning",
        wcagLevel: "A",
        description: "Image has empty alt text but may be meaningful",
        suggestion:
          'Provide descriptive alt text or add aria-hidden="true" if decorative',
      });
    }
  }

  // Check for missing form labels
  if (["input", "select", "textarea"].includes(tagName)) {
    const inputElement = element as HTMLInputElement;
    if (!a11yTest.hasProperLabeling(inputElement)) {
      issues.push({
        element,
        issue: "missing-form-label",
        severity: "error",
        wcagLevel: "A",
        description: "Form control is missing a label",
        suggestion:
          "Add a <label> element, aria-label, or aria-labelledby attribute",
      });
    }
  }

  // Check for interactive elements without accessible names
  if (
    a11yTest.isKeyboardAccessible(element) &&
    !a11yTest.hasAccessibleName(element)
  ) {
    issues.push({
      element,
      issue: "missing-accessible-name",
      severity: "error",
      wcagLevel: "A",
      description: "Interactive element lacks accessible name",
      suggestion: "Add aria-label, aria-labelledby, or visible text content",
    });
  }

  // Check for buttons without proper roles
  if (role === "button" && !element.hasAttribute("tabindex")) {
    issues.push({
      element,
      issue: "button-role-missing-tabindex",
      severity: "error",
      wcagLevel: "A",
      description: "Element with button role is not keyboard accessible",
      suggestion: 'Add tabindex="0" to make the element focusable',
    });
  }

  // Check for missing table headers
  if (tagName === "table") {
    const tableElement = element as HTMLTableElement;
    if (!a11yTest.hasProperTableHeaders(tableElement)) {
      issues.push({
        element,
        issue: "table-missing-headers",
        severity: "error",
        wcagLevel: "A",
        description: "Table is missing proper headers",
        suggestion:
          "Add <th> elements with scope attributes or id/headers associations",
      });
    }
  }

  // Check for missing table captions
  if (
    tagName === "table" &&
    !element.querySelector("caption") &&
    !element.hasAttribute("aria-label") &&
    !element.hasAttribute("aria-labelledby")
  ) {
    issues.push({
      element,
      issue: "table-missing-caption",
      severity: "warning",
      wcagLevel: "A",
      description: "Table is missing a caption or accessible name",
      suggestion:
        "Add a <caption> element, aria-label, or aria-labelledby attribute",
    });
  }

  // Check for insufficient color contrast (basic check)
  if (element.textContent?.trim()) {
    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;

    if (
      backgroundColor === color ||
      (backgroundColor === "rgba(0, 0, 0, 0)" && color === "rgb(0, 0, 0)")
    ) {
      issues.push({
        element,
        issue: "insufficient-color-contrast",
        severity: "warning",
        wcagLevel: "AA",
        description: "Text may have insufficient color contrast",
        suggestion:
          "Ensure text has sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text)",
      });
    }
  }

  // Check for missing heading hierarchy
  if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
    const level = parseInt(tagName.charAt(1));
    const previousHeadings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    ).filter(
      (h) =>
        h.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING
    );

    if (previousHeadings.length > 0) {
      const lastHeading = previousHeadings[previousHeadings.length - 1];
      const lastLevel = parseInt(lastHeading.tagName.charAt(1));

      if (level > lastLevel + 1) {
        issues.push({
          element,
          issue: "heading-hierarchy-skip",
          severity: "warning",
          wcagLevel: "AA",
          description: "Heading level skips in hierarchy",
          suggestion:
            "Use heading levels in sequential order (h1, h2, h3, etc.)",
        });
      }
    }
  }

  // Check for missing lang attribute on html element
  if (tagName === "html" && !element.hasAttribute("lang")) {
    issues.push({
      element,
      issue: "missing-lang-attribute",
      severity: "error",
      wcagLevel: "A",
      description: "HTML element is missing lang attribute",
      suggestion:
        'Add lang attribute to specify the page language (e.g., lang="en")',
    });
  }

  // Check for missing skip links
  if (tagName === "body") {
    const skipLinks = element.querySelectorAll('a[href^="#"]');
    const hasSkipToMain = Array.from(skipLinks).some(
      (link) =>
        link.textContent?.toLowerCase().includes("skip") &&
        link.textContent?.toLowerCase().includes("main")
    );

    if (!hasSkipToMain) {
      issues.push({
        element,
        issue: "missing-skip-link",
        severity: "warning",
        wcagLevel: "A",
        description: "Page is missing skip to main content link",
        suggestion:
          "Add a skip link at the beginning of the page for keyboard users",
      });
    }
  }

  // Check for missing focus indicators
  if (a11yTest.isKeyboardAccessible(element)) {
    const style = window.getComputedStyle(element, ":focus");
    const outline = style.outline;
    const boxShadow = style.boxShadow;

    if (outline === "none" && boxShadow === "none") {
      issues.push({
        element,
        issue: "missing-focus-indicator",
        severity: "error",
        wcagLevel: "AA",
        description: "Interactive element lacks visible focus indicator",
        suggestion: "Add CSS focus styles with outline or box-shadow",
      });
    }
  }

  // Check for redundant links
  if (tagName === "a" && element.hasAttribute("href")) {
    const linkText = element.textContent?.trim().toLowerCase();
    const href = element.getAttribute("href");

    if (linkText && href) {
      const similarLinks = Array.from(document.querySelectorAll("a")).filter(
        (link) =>
          link !== element &&
          link.textContent?.trim().toLowerCase() === linkText &&
          link.getAttribute("href") === href
      );

      if (similarLinks.length > 0) {
        issues.push({
          element,
          issue: "redundant-links",
          severity: "info",
          wcagLevel: "AAA",
          description: "Multiple links with same text and destination",
          suggestion:
            "Consider combining redundant links or making link text more specific",
        });
      }
    }
  }

  return issues;
};

/**
 * Generate accessibility report
 */
export const generateAccessibilityReport = (
  result: AccessibilityAuditResult
): string => {
  const { issues, summary } = result;

  let report = `Accessibility Audit Report\n`;
  report += `==========================\n\n`;
  report += `Summary:\n`;
  report += `- Total Issues: ${summary.total}\n`;
  report += `- Errors: ${summary.errors}\n`;
  report += `- Warnings: ${summary.warnings}\n`;
  report += `- Info: ${summary.info}\n`;
  report += `- Overall Status: ${result.passed ? "PASSED" : "FAILED"}\n\n`;

  if (issues.length === 0) {
    report += `No accessibility issues found! 🎉\n`;
    return report;
  }

  // Group issues by severity
  const errorIssues = issues.filter((i) => i.severity === "error");
  const warningIssues = issues.filter((i) => i.severity === "warning");
  const infoIssues = issues.filter((i) => i.severity === "info");

  if (errorIssues.length > 0) {
    report += `ERRORS (${errorIssues.length}):\n`;
    report += `================\n`;
    errorIssues.forEach((issue, index) => {
      report += `${index + 1}. ${issue.description}\n`;
      report += `   Element: ${issue.element.tagName.toLowerCase()}`;
      if (issue.element.id) report += `#${issue.element.id}`;
      if (issue.element.className)
        report += `.${issue.element.className.split(" ").join(".")}`;
      report += `\n`;
      report += `   WCAG Level: ${issue.wcagLevel}\n`;
      report += `   Suggestion: ${issue.suggestion}\n\n`;
    });
  }

  if (warningIssues.length > 0) {
    report += `WARNINGS (${warningIssues.length}):\n`;
    report += `==================\n`;
    warningIssues.forEach((issue, index) => {
      report += `${index + 1}. ${issue.description}\n`;
      report += `   Element: ${issue.element.tagName.toLowerCase()}`;
      if (issue.element.id) report += `#${issue.element.id}`;
      if (issue.element.className)
        report += `.${issue.element.className.split(" ").join(".")}`;
      report += `\n`;
      report += `   WCAG Level: ${issue.wcagLevel}\n`;
      report += `   Suggestion: ${issue.suggestion}\n\n`;
    });
  }

  if (infoIssues.length > 0) {
    report += `INFO (${infoIssues.length}):\n`;
    report += `=============\n`;
    infoIssues.forEach((issue, index) => {
      report += `${index + 1}. ${issue.description}\n`;
      report += `   Element: ${issue.element.tagName.toLowerCase()}`;
      if (issue.element.id) report += `#${issue.element.id}`;
      if (issue.element.className)
        report += `.${issue.element.className.split(" ").join(".")}`;
      report += `\n`;
      report += `   WCAG Level: ${issue.wcagLevel}\n`;
      report += `   Suggestion: ${issue.suggestion}\n\n`;
    });
  }

  return report;
};

/**
 * Run accessibility audit and log results
 */
export const runAccessibilityAudit = (
  container: HTMLElement = document.body
): void => {
  const result = auditAccessibility(container);
  const report = generateAccessibilityReport(result);

  console.group("🔍 Accessibility Audit Results");

  if (result.passed) {
    console.log("✅ All accessibility checks passed!");
  } else {
    console.warn("⚠️ Accessibility issues found:");
  }

  console.log(report);
  console.groupEnd();

  // Also log individual issues for easier debugging
  if (result.issues.length > 0) {
    console.group("🐛 Individual Issues");
    result.issues.forEach((issue) => {
      const logMethod =
        issue.severity === "error"
          ? console.error
          : issue.severity === "warning"
          ? console.warn
          : console.info;

      logMethod(`${issue.description}`, issue.element);
    });
    console.groupEnd();
  }
};

/**
 * Accessibility testing utilities for development
 */
export const a11yDev = {
  /**
   * Add accessibility audit to development tools
   */
  addToDevTools: () => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      (window as any).a11yAudit = runAccessibilityAudit;
      console.log("🔧 Accessibility audit available as window.a11yAudit()");
    }
  },

  /**
   * Monitor for accessibility issues on DOM changes
   */
  startMonitoring: () => {
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "development"
    ) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      let shouldAudit = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldAudit = true;
        }
      });

      if (shouldAudit) {
        // Debounce the audit
        setTimeout(() => {
          runAccessibilityAudit();
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("👀 Accessibility monitoring started");

    return () => {
      observer.disconnect();
      console.log("👋 Accessibility monitoring stopped");
    };
  },
};
