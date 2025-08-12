# Implementation Plan

- [ ] 1. Set up project structure and database foundation

  - Create directory structure for backend API, frontend components, and database migrations
  - Set up package.json files with necessary dependencies for Node.js/Express backend and React frontend
  - Configure TypeScript for both frontend and backend
  - _Requirements: All requirements depend on proper project setup_

- [ ] 2. Implement database schema and migrations

  - Create database migration files for all tables: products, product_variants, locations, product_locations, companies, purchase_orders, purchase_order_products
  - Write SQL migration scripts with proper indexes and foreign key constraints
  - Create database seed files with sample data for development and testing
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2_

- [ ] 3. Create core data models and validation
- [ ] 3.1 Implement TypeScript interfaces and types

  - Define TypeScript interfaces for all database entities (Product, ProductVariant, Location, Company, PurchaseOrder, etc.)
  - Create API request/response type definitions
  - Write validation schemas using a library like Joi or Zod
  - _Requirements: 1.2, 2.2, 4.2_

- [ ] 3.2 Implement database connection and ORM setup

  - Set up database connection with connection pooling
  - Configure ORM (Sequelize, TypeORM, or Prisma) with model definitions
  - Create base repository classes with common CRUD operations
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 4. Build summary metrics service and API
- [ ] 4.1 Implement summary metrics calculation logic

  - Write service functions to calculate total products count from active products
  - Create queries to count low stock products (below reorder point)
  - Implement out of stock detection (zero quantity across all locations)
  - Create supplier count calculation from active suppliers
  - Implement total stock value calculation using Σ(unit_cost × quantity) formula
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.1, 10.2_

- [ ] 4.2 Create summary metrics API endpoint

  - Build GET /api/dashboard/summary-metrics endpoint
  - Implement response formatting with status indicators
  - Add caching for performance optimization
  - Write unit tests for summary metrics service and API endpoint
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 5. Build inventory service and stock levels API
- [ ] 5.1 Implement stock levels aggregation logic

  - Write service functions to aggregate product quantities across locations and variants
  - Create database queries with proper joins to fetch product details with inventory levels
  - Implement low stock detection logic based on reorder points
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 5.2 Create stock levels API endpoint

  - Build GET /api/dashboard/stock-levels endpoint with filtering and sorting
  - Implement warehouse filtering and stock status filtering (All, Low Stock, Out of Stock)
  - Add response formatting to match frontend requirements with unit costs and values
  - Add error handling and input validation
  - Write unit tests for stock levels service and API endpoint
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.2, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6. Build purchase order service and recent purchases API
- [ ] 6.1 Implement purchase order data retrieval

  - Write service functions to fetch recent purchase orders with supplier information
  - Create queries to get last 10 orders sorted by date with product counts
  - Implement order status tracking and filtering logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6.2 Create recent purchases API endpoint

  - Build GET /api/dashboard/recent-purchases endpoint
  - Implement response formatting with supplier details and order summaries
  - Add pagination support for scalability
  - Write unit tests for purchase order service and API endpoint
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 7. Implement warehouse distribution functionality
- [ ] 7.1 Create location-based inventory queries

  - Write service functions to group inventory by warehouse locations
  - Implement location filtering and quantity breakdown logic
  - Create queries to identify stock distribution imbalances
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7.2 Build warehouse distribution API endpoint

  - Create GET /api/dashboard/warehouse-distribution endpoint
  - Implement location-based filtering and grouping in API responses
  - Add support for warehouse information display
  - Write unit tests for warehouse distribution functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 8. Implement supplier management integration
- [ ] 8.1 Create supplier information service

  - Write service functions to fetch supplier details and contact information
  - Implement supplier performance tracking queries
  - Create supplier-to-purchase-order relationship queries
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 8.2 Build supplier API endpoints

  - Create GET /api/suppliers endpoint with detailed supplier information
  - Implement supplier contact details and order history endpoints
  - Add supplier performance indicators to API responses
  - Write unit tests for supplier service functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 9. Create frontend project structure and base components
- [ ] 9.1 Set up React application with routing

  - Initialize React application with TypeScript and necessary dependencies
  - Configure React Router for dashboard navigation
  - Set up state management (Context API or Redux Toolkit)
  - Create base layout components and navigation structure
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9.2 Implement API client and data fetching utilities

  - Create HTTP client with error handling and retry logic
  - Implement custom hooks for API data fetching
  - Set up loading states and error boundary components
  - Write TypeScript interfaces for API responses
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 9.3 Create global warehouse filter component

  - Build warehouse filter dropdown component with location selection
  - Implement "All Warehouses" option for aggregated view
  - Create context provider for warehouse filter state management
  - Add persistent filter state across page navigation
  - Write component tests for warehouse filter functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10. Build summary metrics frontend component
- [ ] 10.1 Create metric cards display component

  - Build responsive metric cards layout with five cards (Total Products, Low Stock, Out of Stock, Suppliers, Total Stock Value)
  - Implement real-time data updates with auto-refresh
  - Add visual status indicators (normal, warning, critical) with appropriate colors
  - Create loading states and error handling for metrics data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 10.2 Add metric card interactions and navigation

  - Implement click-through navigation from metric cards to detailed views
  - Add hover effects and accessibility features for metric cards
  - Create responsive layout for mobile and tablet devices
  - Write component tests for summary metrics functionality
  - _Requirements: 6.1, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4_

- [ ] 11. Build stock levels frontend component
- [ ] 11.1 Create stock levels display component

  - Build responsive table/grid component for product inventory display
  - Implement product image display with lazy loading
  - Add sorting functionality for SKU, category, and quantity columns
  - Create low stock visual indicators and highlighting
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 11.2 Add search and filtering functionality

  - Implement search input for product SKU and name filtering
  - Create category filter dropdown with multi-select capability
  - Add stock status filter dropdown (All, Low Stock, Out of Stock)
  - Add quantity range filtering controls
  - Write component tests for stock levels functionality
  - _Requirements: 1.1, 1.2, 5.2, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 12. Build recent purchases frontend component
- [ ] 12.1 Create purchase orders list component

  - Build chronological list component for recent purchase orders
  - Implement status badges with color coding for order statuses
  - Add supplier name display with clickable links
  - Create order date formatting and product count display
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 12.2 Add purchase order details and interactions

  - Implement expandable order details with product breakdown
  - Add auto-refresh functionality for real-time status updates
  - Create overdue order highlighting and notifications
  - Write component tests for recent purchases functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 13. Build warehouse distribution frontend component
- [ ] 13.1 Create location-based inventory display

  - Build warehouse filtering dropdown with location selection
  - Implement quantity breakdown display by warehouse location
  - Create warehouse information display (name, address)
  - Add visual indicators for stock distribution imbalances
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 13.2 Add distribution analysis features

  - Implement transfer suggestion indicators
  - Create location comparison views
  - Add warehouse capacity and utilization displays
  - Write component tests for warehouse distribution functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 14. Implement responsive design and mobile optimization
- [ ] 14.1 Create responsive layouts for all components

  - Implement CSS Grid and Flexbox layouts for responsive design
  - Create mobile-optimized navigation and component layouts
  - Add touch-friendly interactions for tablet and mobile devices
  - Test responsive behavior across different screen sizes
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 14.2 Add accessibility features

  - Implement ARIA labels and semantic HTML structure
  - Add keyboard navigation support for all interactive elements
  - Create screen reader compatible table structures
  - Test accessibility compliance with automated tools
  - _Requirements: 7.4_

- [ ] 15. Implement performance optimizations
- [ ] 15.1 Add database query optimizations

  - Create database indexes for frequently queried columns
  - Implement query result caching with Redis
  - Optimize complex joins and aggregation queries
  - Add database connection pooling configuration
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 15.2 Optimize frontend performance

  - Implement code splitting and lazy loading for components
  - Add virtual scrolling for large product lists
  - Optimize image loading with compression and multiple sizes
  - Implement service worker for caching API responses
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 16. Add comprehensive error handling and logging
- [ ] 16.1 Implement backend error handling

  - Create centralized error handling middleware
  - Add structured logging with different log levels
  - Implement API rate limiting and input validation
  - Create error response standardization
  - _Requirements: 5.4_

- [ ] 16.2 Add frontend error handling

  - Implement error boundary components for graceful error handling
  - Create retry mechanisms for failed API calls
  - Add user-friendly error messages and empty states
  - Implement offline detection and handling
  - _Requirements: 5.4_

- [ ] 17. Write comprehensive tests and documentation
- [ ] 17.1 Create backend integration tests

  - Write API endpoint integration tests with test database
  - Create database query performance tests
  - Implement load testing for concurrent user scenarios
  - Add API documentation with OpenAPI/Swagger
  - _Requirements: All requirements need testing coverage_

- [ ] 17.2 Create frontend component tests

  - Write unit tests for all React components using Jest and React Testing Library
  - Create end-to-end tests for complete user workflows
  - Add cross-browser compatibility testing
  - Implement visual regression testing for UI components
  - _Requirements: All requirements need testing coverage_

- [ ] 18. Build stock visualization service and API
- [ ] 18.1 Implement chart data aggregation logic

  - Write service functions to aggregate stock data by product and warehouse for chart display
  - Create queries to fetch product names, SKUs, and quantities grouped by warehouse
  - Implement data transformation for chart-ready format with proper grouping
  - Add color assignment logic for consistent warehouse representation
  - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [ ] 18.2 Create stock visualization API endpoint

  - Build GET /api/dashboard/stock-visualization endpoint with warehouse filtering
  - Implement response formatting optimized for chart rendering libraries
  - Add chart configuration data including titles, labels, and color palettes
  - Add caching for improved chart loading performance
  - Write unit tests for visualization service and API endpoint
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8_

- [ ] 19. Build stock visualization frontend component
- [ ] 19.1 Create bar/column chart component

  - Implement bar/column chart using a charting library (Chart.js, Recharts, or D3)
  - Create chart component with "Stock by Product per Warehouse" title
  - Implement grouped bar display for multi-warehouse comparison
  - Add responsive chart sizing and layout for different screen sizes
  - _Requirements: 11.1, 11.2, 11.3, 11.10_

- [ ] 19.2 Add chart interactivity and filtering integration

  - Implement interactive tooltips showing exact quantities, product names, and warehouse information
  - Connect chart to global warehouse filter for real-time data updates
  - Add smooth animations for data transitions when filters change
  - Implement empty state display when no data matches current filters
  - Apply brand styling guidelines for colors, fonts, and visual elements
  - Write component tests for stock visualization functionality
  - _Requirements: 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

- [ ] 20. Build products management service and API endpoints
- [ ] 20.1 Implement enhanced product CRUD service functions with reorder point management

  - Write service functions for product creation with per-warehouse stock level initialization
  - Create database queries for product listing with reorder point status calculation
  - Implement product validation logic including SKU uniqueness and reorder point validation
  - Add stock status calculation logic based on reorder points (adequate, low stock, out of stock)
  - Create warehouse stock level management functions for product creation
  - Implement product-supplier relationship management functions
  - Create product category management functions
  - Add database transaction handling for product creation with inventory records
  - _Requirements: 12.1, 12.6, 12.7, 14.3, 14.6, 14.7, 14.10, 14.11, 14.13, 15.3, 15.4, 15.6, 15.7, 16.5, 16.6, 17.2, 17.3, 17.4, 18.2, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 19.10_

- [ ] 20.2 Create enhanced products management API endpoints

  - Build GET /api/products endpoint with filtering, sorting, and pagination
  - Create GET /api/products/{id} endpoint for detailed product information with stock breakdown
  - Implement POST /api/products endpoint for product creation with per-warehouse stock levels
  - Build PUT /api/products/{id} endpoint for product updates
  - Create DELETE /api/products/{id} endpoint with safety checks
  - Implement GET /api/products/categories endpoint for category dropdown
  - Add GET /api/products/validate-sku/{sku} endpoint for real-time SKU validation
  - Create GET /api/warehouses endpoint for warehouse list in product form
  - Write unit tests for all enhanced product management API endpoints
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 13.1, 13.2, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10, 14.11, 14.12, 14.13, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 19.10_

- [ ] 21. Build products page frontend component
- [ ] 21.1 Create products table component

  - Build responsive products table with Image, Name, Category, Sale Price, Cost Price, Stock, Warehouse count columns
  - Implement lazy loading for product images with placeholder states
  - Add sortable column headers with visual sort indicators
  - Create pagination controls for large product catalogs
  - Add loading states and error handling for product data
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 21.2 Add product table actions and interactions

  - Implement "Add Product" button with modal trigger
  - Create "View" action buttons for each product row
  - Add "Delete" action buttons with confirmation dialogs
  - Implement row selection and bulk actions (future enhancement)
  - Add responsive behavior for mobile and tablet devices
  - Write component tests for products table functionality
  - _Requirements: 12.1, 12.8, 13.1, 14.1, 16.1, 16.2_

- [ ] 22. Build product search and filtering functionality
- [ ] 22.1 Create product search component

  - Build real-time search input for product name, SKU, and category filtering
  - Implement debounced search to optimize API calls
  - Add search result highlighting and clear search functionality
  - Create search suggestions dropdown for better user experience
  - _Requirements: 17.1, 17.2_

- [ ] 22.2 Add product filtering controls

  - Create category filter dropdown with all available categories
  - Implement stock status filter (All, In Stock, Low Stock, Out of Stock)
  - Add price range filtering controls for sale price and cost price
  - Create filter state management and URL synchronization
  - Add clear all filters functionality and active filter indicators
  - Write component tests for search and filtering functionality
  - _Requirements: 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9_

- [ ] 23. Build product detail modal component
- [ ] 23.1 Create product detail view modal

  - Build modal component displaying product image, name, SKU, description, category, pricing
  - Implement stock levels breakdown by warehouse location with visual indicators
  - Add supplier information display with contact details
  - Create product variants display if applicable
  - Show recent purchase history for the product
  - Add modal navigation controls (close button, escape key, outside click)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ] 23.2 Add product detail modal responsiveness and accessibility

  - Implement responsive modal design for mobile and tablet devices
  - Add ARIA labels and keyboard navigation support
  - Create loading states for product detail data fetching
  - Add error handling for failed product detail requests
  - Write component tests for product detail modal functionality
  - _Requirements: 13.8, 7.4_

- [ ] 24. Build comprehensive product form component with per-warehouse stock management
- [ ] 24.1 Create enhanced product form with all required fields

  - Build form component with required fields: name, SKU, category, cost price, sale price, reorder point
  - Add optional fields: description, image URL (with preview)
  - Implement per-warehouse stock level inputs with dynamic warehouse list
  - Create form sections: Basic Info, Pricing, Stock Management, Image
  - Add real-time form validation with field-specific error messages
  - _Requirements: 14.3, 14.4, 14.5, 14.6, 14.10, 14.13, 19.1_

- [ ] 24.2 Implement advanced form validation and user experience

  - Create SKU uniqueness validation with backend API checking and debounce
  - Add reorder point validation (positive numbers only)
  - Implement warehouse stock quantity validation (non-negative numbers)
  - Add image URL validation with preview functionality
  - Create sale price vs cost price validation (sale >= cost)
  - Add form auto-save draft functionality for long forms
  - Implement unsaved changes warning on modal close
  - _Requirements: 14.7, 14.11, 14.12, 19.2, 19.9_

- [ ] 24.3 Build warehouse stock management section

  - Fetch and display all active warehouses with names and addresses
  - Create quantity input fields for each warehouse location
  - Implement default quantity of 0 for all warehouses
  - Add visual indicators for required vs optional stock setup
  - Create warehouse stock validation and error handling
  - Add at least one warehouse stock > 0 warning (not blocking)
  - _Requirements: 14.6, 14.13, 19.5, 19.6_

- [ ] 24.4 Add form submission and state management

  - Implement form submission for product creation with warehouse stock levels
  - Add loading states during form submission and SKU validation
  - Create comprehensive success and error message handling
  - Add form reset and cancel functionality with confirmation
  - Create responsive form layout for mobile devices
  - Write component tests for enhanced product form functionality
  - _Requirements: 14.9, 14.10, 14.11, 14.12, 19.9, 19.10_

- [ ] 25. Build product edit functionality
- [ ] 25.1 Create edit mode for product detail modal

  - Add "Edit" button to product detail modal
  - Implement modal state switching between view and edit modes
  - Pre-populate form fields with current product data
  - Prevent SKU modification in edit mode for data integrity
  - Add save and cancel buttons with appropriate actions
  - _Requirements: 15.1, 15.2, 15.3, 15.5, 15.8, 15.9_

- [ ] 25.2 Integrate edit functionality with form validation

  - Connect edit mode to product form component
  - Implement validation for edit operations
  - Add confirmation dialogs for unsaved changes
  - Create optimistic updates with rollback on failure
  - Write component tests for product edit functionality
  - _Requirements: 15.4, 15.6, 15.7, 15.8, 15.9_

- [ ] 26. Build product deletion functionality
- [ ] 26.1 Create delete confirmation system

  - Build confirmation dialog component with product details
  - Add warnings about deletion consequences (stock levels, purchase orders)
  - Implement safety checks for products with active purchase orders
  - Create stock level warnings for products with current inventory
  - Add explicit confirmation requirements before deletion
  - _Requirements: 16.2, 16.3, 16.4, 16.7, 16.8_

- [ ] 26.2 Implement delete operations with error handling

  - Connect delete confirmation to API delete endpoint
  - Add loading states during deletion process
  - Implement success messages and table refresh after deletion
  - Create comprehensive error handling for failed deletions
  - Add data integrity protection and rollback mechanisms
  - Write component tests for product deletion functionality
  - _Requirements: 16.5, 16.6, 16.9_

- [ ] 27. Build supplier integration within product management
- [ ] 27.1 Create supplier display and selection components

  - Build supplier information display within product details
  - Create supplier dropdown component with search functionality
  - Implement supplier contact details display
  - Add recent purchase order history for product-supplier relationships
  - Create multiple supplier support for products
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 27.2 Add supplier management interactions

  - Implement supplier profile navigation from product interface
  - Add supplier assignment and removal functionality
  - Create placeholder displays for products without suppliers
  - Add real-time updates when supplier information changes
  - Write component tests for supplier integration functionality
  - _Requirements: 18.6, 18.7, 18.8_

- [ ] 28. Integrate product management with existing dashboard
- [ ] 28.1 Add navigation and routing for products page

  - Create navigation menu item for products page
  - Implement React Router configuration for products routes
  - Add breadcrumb navigation for product management sections
  - Create deep linking support for product details and edit modes
  - _Requirements: All product management requirements need navigation_

- [ ] 28.2 Connect product management to dashboard metrics with reorder point integration

  - Update summary metrics to reflect product management changes and reorder point calculations
  - Ensure stock levels component updates when products are modified with new reorder point status
  - Connect warehouse filtering to product management pages
  - Add real-time updates across dashboard when products change including stock status recalculation
  - Update low stock detection throughout dashboard to use reorder point thresholds
  - Integrate reorder point status into stock visualization charts
  - Write integration tests for product management and dashboard connectivity with reorder points
  - _Requirements: 6.1, 6.2, 6.6, 8.2, 8.4, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [ ] 29. Implement reorder point management across dashboard components
- [ ] 29.1 Update existing dashboard components for reorder point integration

  - Modify summary metrics component to use reorder point calculations for low stock count
  - Update stock levels component to display reorder point status and visual indicators
  - Enhance stock visualization chart to show reorder point thresholds
  - Add reorder point information to product detail modals
  - Update warehouse distribution component to show reorder point status by location
  - _Requirements: 19.3, 19.4, 19.6, 19.7, 19.8_

- [ ] 29.2 Create reorder point management utilities and services

  - Build utility functions for stock status calculation based on reorder points
  - Create service functions to recalculate stock status when inventory changes
  - Implement reorder point validation and business logic
  - Add reorder point update functionality for existing products
  - Create automated reorder point suggestions based on historical data (future enhancement)
  - Write unit tests for reorder point management functionality
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.9, 19.10_
