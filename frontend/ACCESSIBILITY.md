# Accessibility Implementation Guide

This document outlines the accessibility features implemented in the Inventory Dashboard and provides guidelines for maintaining and extending accessibility support.

## Overview

The Inventory Dashboard has been designed and implemented with accessibility as a core requirement, following WCAG 2.1 AA guidelines. All components include proper semantic HTML, ARIA attributes, keyboard navigation, and screen reader support.

## Implemented Accessibility Features

### 1. Semantic HTML Structure

- **Proper heading hierarchy**: H1 for page titles, H2 for section headings, etc.
- **Landmark elements**: `<main>`, `<nav>`, `<section>`, `<header>` for page structure
- **Form labels**: All form controls have associated labels
- **Table structure**: Proper `<th>`, `<td>`, `<caption>` elements with scope attributes

### 2. ARIA Attributes and Roles

- **aria-label**: Descriptive labels for interactive elements
- **aria-labelledby**: References to heading elements
- **aria-describedby**: References to help text and descriptions
- **aria-live**: Live regions for dynamic content updates
- **aria-expanded**: State of collapsible elements
- **aria-sort**: Sort state of table columns
- **role attributes**: Button, status, alert, and other semantic roles

### 3. Keyboard Navigation

- **Tab order**: Logical tab sequence through interactive elements
- **Enter/Space**: Activation of buttons and interactive elements
- **Arrow keys**: Navigation within tables and lists
- **Escape**: Close modals and dropdowns
- **Home/End**: Jump to first/last items in lists

### 4. Screen Reader Support

- **Live regions**: Announcements for status changes and updates
- **Descriptive labels**: Clear and concise element descriptions
- **Status indicators**: Proper announcement of loading, error, and success states
- **Table navigation**: Column headers and row relationships

### 5. Visual Accessibility

- **Focus indicators**: Visible focus rings on all interactive elements
- **Color contrast**: WCAG AA compliant contrast ratios
- **High contrast mode**: Support for system high contrast preferences
- **Reduced motion**: Respects user's motion preferences

## Component-Specific Accessibility Features

### SummaryMetrics Component

- **Metric cards**: Role="button" with descriptive aria-labels
- **Status indicators**: Visual and programmatic status communication
- **Live regions**: Real-time updates announced to screen readers
- **Keyboard navigation**: Tab and Enter/Space activation

```tsx
// Example usage
<MetricCard
  title="Total Products"
  value={100}
  status="normal"
  onClick={handleClick}
  aria-label="Total Products: 100, click to view details"
/>
```

### StockLevels Component

- **Sortable table**: Proper table structure with sortable column headers
- **Search and filters**: Labeled form controls with help text
- **Mobile accessibility**: Alternative list view for small screens
- **Status badges**: Color and text indicators for stock levels

```tsx
// Example table structure
<table role="table" aria-label="Stock levels table">
  <caption className="sr-only">
    Stock levels for products with sorting and filtering options
  </caption>
  <thead>
    <tr>
      <th scope="col" aria-sort="ascending">
        <button aria-label="Product name, sorted ascending">
          Product Name
        </button>
      </th>
    </tr>
  </thead>
</table>
```

### Products Page

- **Form accessibility**: Proper labeling and validation messages
- **Table structure**: Semantic table with column headers
- **Action buttons**: Clear labels and keyboard accessibility
- **Status communication**: Loading and error states

### Navigation and Layout

- **Skip links**: Jump to main content for keyboard users
- **Breadcrumbs**: Clear navigation path
- **Responsive design**: Touch-friendly targets on mobile
- **Landmark navigation**: Screen reader navigation by regions

## Testing and Validation

### Automated Testing

The project includes comprehensive accessibility tests using:

- **jest-axe**: Automated accessibility rule checking
- **@testing-library/react**: Semantic queries and user interaction testing
- **Custom accessibility utilities**: Additional validation rules

```bash
# Run accessibility tests
npm test -- accessibility.test.tsx
```

### Manual Testing Checklist

#### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Verify logical tab order
- [ ] Test Enter/Space activation
- [ ] Test arrow key navigation in tables
- [ ] Test Escape key for modals

#### Screen Reader Testing

- [ ] Test with VoiceOver (macOS) or NVDA (Windows)
- [ ] Verify proper announcements for state changes
- [ ] Check table navigation and column headers
- [ ] Test form field labels and validation messages
- [ ] Verify live region announcements

#### Visual Testing

- [ ] Check focus indicators are visible
- [ ] Verify color contrast meets WCAG AA standards
- [ ] Test high contrast mode
- [ ] Verify responsive design on mobile devices
- [ ] Test with 200% zoom level

### Development Tools

The project includes development-time accessibility tools:

```javascript
// Available in browser console during development
window.a11yAudit(); // Run accessibility audit
window.a11yDevUtils.trackFocus(); // Track focus path
window.a11yDevUtils.validateAria(); // Validate ARIA attributes
```

## Best Practices and Guidelines

### 1. Writing Accessible Components

```tsx
// Good: Proper labeling and structure
const AccessibleButton = ({ onClick, children, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    aria-disabled={loading}
    aria-busy={loading}
    aria-label={loading ? "Loading..." : undefined}
  >
    {children}
  </button>
);

// Good: Proper form structure
const AccessibleInput = ({ label, error, ...props }) => (
  <div>
    <label htmlFor={props.id}>{label}</label>
    <input
      {...props}
      aria-invalid={error ? "true" : "false"}
      aria-describedby={error ? `${props.id}-error` : undefined}
    />
    {error && (
      <div id={`${props.id}-error`} role="alert">
        {error}
      </div>
    )}
  </div>
);
```

### 2. Table Accessibility

```tsx
// Proper table structure
<table role="table" aria-label="Product inventory">
  <caption>Product inventory with stock levels and pricing</caption>
  <thead>
    <tr>
      <th scope="col" id="product-name">
        Product Name
      </th>
      <th scope="col" id="stock-level">
        Stock Level
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td headers="product-name">Widget A</td>
      <td headers="stock-level">150 units</td>
    </tr>
  </tbody>
</table>
```

### 3. Live Regions for Dynamic Content

```tsx
// Status updates
<div aria-live="polite" aria-atomic="true">
  {loading && "Loading data..."}
  {error && `Error: ${error.message}`}
  {success && "Data loaded successfully"}
</div>

// Critical alerts
<div role="alert" aria-live="assertive">
  {criticalError && "Critical error occurred!"}
</div>
```

### 4. Modal Accessibility

```tsx
const AccessibleModal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      // Trap focus within modal
      const cleanup = trapFocus(modalRef.current);
      return cleanup;
    }
  }, [isOpen]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose} aria-label="Close modal">
        ×
      </button>
    </div>
  );
};
```

## Common Accessibility Issues and Solutions

### Issue: Missing Form Labels

```tsx
// Bad
<input type="text" placeholder="Enter name" />

// Good
<label htmlFor="name-input">Name</label>
<input id="name-input" type="text" placeholder="Enter name" />
```

### Issue: Poor Color Contrast

```css
/* Bad - insufficient contrast */
.text {
  color: #999;
  background: #fff;
} /* 2.85:1 ratio */

/* Good - sufficient contrast */
.text {
  color: #666;
  background: #fff;
} /* 4.54:1 ratio */
```

### Issue: Missing Focus Indicators

```css
/* Bad - removes focus outline */
button:focus {
  outline: none;
}

/* Good - custom focus indicator */
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### Issue: Inaccessible Interactive Elements

```tsx
// Bad - div as button
<div onClick={handleClick}>Click me</div>

// Good - proper button
<button onClick={handleClick}>Click me</button>

// Good - div with proper ARIA
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>
```

## Resources and References

### WCAG Guidelines

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa)
- [WebAIM Accessibility Guidelines](https://webaim.org/standards/wcag/)

### Testing Tools

- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Color Contrast Analyzers](https://www.tpgi.com/color-contrast-checker/)

### Screen Readers

- [VoiceOver (macOS)](https://support.apple.com/guide/voiceover/)
- [NVDA (Windows)](https://www.nvaccess.org/)
- [JAWS (Windows)](https://www.freedomscientific.com/products/software/jaws/)

### ARIA Documentation

- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [ARIA Roles Reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)

## Maintenance and Updates

### Regular Accessibility Audits

- Run automated tests with every build
- Perform manual testing for new features
- Conduct periodic comprehensive audits
- Test with actual assistive technology users

### Keeping Up to Date

- Monitor WCAG guideline updates
- Update testing tools and dependencies
- Review accessibility best practices
- Train team members on accessibility principles

### Reporting Issues

When reporting accessibility issues, include:

- Specific component or page affected
- Steps to reproduce the issue
- Expected vs. actual behavior
- Assistive technology used (if applicable)
- Severity level (critical, major, minor)

## Conclusion

Accessibility is an ongoing commitment, not a one-time implementation. By following these guidelines and maintaining regular testing practices, we ensure that the Inventory Dashboard remains accessible to all users, regardless of their abilities or the assistive technologies they use.

For questions or suggestions regarding accessibility, please consult the development team or refer to the resources listed above.
