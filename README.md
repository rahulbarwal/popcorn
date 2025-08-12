# Inventory Dashboard

A comprehensive web application that provides warehouse and procurement teams with full visibility into stock status, purchase activity, and distribution across multiple warehouses.

## Project Structure

```
inventory-dashboard/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # API route handlers
│   │   ├── middleware/     # Custom middleware functions
│   │   ├── migrations/     # Database migration files
│   │   ├── models/         # Database models and types
│   │   ├── routes/         # API route definitions
│   │   ├── seeds/          # Database seed files
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── knexfile.js
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── test/           # Test setup and utilities
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main App component
│   │   └── main.tsx        # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment file and configure your database:

   ```bash
   cp .env.example .env
   ```

4. Run database migrations:

   ```bash
   npm run migrate
   ```

5. Seed the database (optional):

   ```bash
   npm run seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The backend server will start on http://localhost:3001

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will start on http://localhost:3000

## Features

- Real-time inventory tracking across multiple warehouses
- Purchase order management and supplier integration
- Interactive dashboard with key metrics and visualizations
- Product management with comprehensive CRUD operations
- Stock replenishment suggestions and automated reordering
- Responsive design for desktop, tablet, and mobile devices

## Technology Stack

### Backend

- Node.js with Express.js
- TypeScript for type safety
- PostgreSQL database
- Knex.js for database migrations and queries
- Joi for request validation

### Frontend

- React 18 with TypeScript
- Vite for fast development and building
- React Router for navigation
- TanStack Query for data fetching and caching
- Recharts for data visualization
- React Hook Form for form management

## Development

### Running Tests

Backend tests:

```bash
cd backend
npm test
```

Frontend tests:

```bash
cd frontend
npm test
```

### Building for Production

Backend:

```bash
cd backend
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
