# Database Setup Guide

This document provides instructions for setting up the PostgreSQL database for the Inventory Dashboard application.

## Prerequisites

- PostgreSQL installed and running
- Node.js and npm installed
- Environment variables configured (see `.env.example`)

## Database Schema

The application uses the following tables:

1. **companies** - Supplier/vendor information
2. **locations** - Warehouse/storage locations
3. **products** - Product catalog with pricing and reorder points
4. **product_variants** - Product variations (size, color, etc.)
5. **product_locations** - Inventory levels by product and location
6. **purchase_orders** - Purchase order headers
7. **purchase_order_products** - Purchase order line items

## Setup Instructions

### 1. Create Database

```bash
# Create the database (replace with your database name from .env)
createdb inventory_dashboard
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the database connection settings:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (default: inventory_dashboard)

### 3. Run Migrations

Execute the database migrations to create all tables:

```bash
npm run migrate
```

### 4. Seed Sample Data

Populate the database with sample data for development and testing:

```bash
npm run seed
```

## Migration Commands

- `npm run migrate` - Run all pending migrations
- `npm run migrate:rollback` - Rollback the last batch of migrations
- `knex migrate:status` - Check migration status
- `knex migrate:make <migration_name>` - Create a new migration

## Seed Commands

- `npm run seed` - Run all seed files
- `knex seed:make <seed_name>` - Create a new seed file

## Database Schema Details

### Key Relationships

- Products can have multiple variants (1:many)
- Products exist in multiple locations with different quantities (many:many through product_locations)
- Purchase orders belong to suppliers and contain multiple products (1:many, many:many)
- All tables include proper foreign key constraints and indexes for performance

### Sample Data Included

- 5 supplier companies
- 5 warehouse locations
- 10 products with variants
- Inventory levels across multiple locations
- 10 purchase orders with line items
- Realistic stock levels including low stock scenarios

### Indexes and Constraints

All tables include:

- Primary key indexes
- Foreign key constraints with appropriate cascade/restrict rules
- Business logic constraints (positive prices, quantities)
- Performance indexes on frequently queried columns
- Unique constraints where appropriate

## Verification

After setup, verify the installation:

```bash
# Check table creation
psql inventory_dashboard -c "\dt"

# Verify sample data
psql inventory_dashboard -c "SELECT COUNT(*) FROM products;"
psql inventory_dashboard -c "SELECT COUNT(*) FROM companies;"
psql inventory_dashboard -c "SELECT COUNT(*) FROM locations;"

# Test relationships
psql inventory_dashboard -c "
  SELECT p.name, pl.quantity_on_hand, l.name as location_name
  FROM products p
  JOIN product_locations pl ON p.id = pl.product_id
  JOIN locations l ON pl.location_id = l.id
  LIMIT 5;
"
```

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running: `brew services start postgresql` (macOS) or `sudo service postgresql start` (Linux)
2. Verify database exists: `psql -l | grep inventory_dashboard`
3. Check connection settings in `.env` file
4. Ensure user has proper permissions

### Migration Issues

1. Check migration status: `knex migrate:status`
2. Rollback and retry: `npm run migrate:rollback && npm run migrate`
3. Verify database user has CREATE/ALTER permissions

### Seed Issues

1. Ensure migrations have run successfully first
2. Clear existing data: `knex seed:run` will delete and recreate seed data
3. Check for foreign key constraint violations in seed data

## Production Considerations

- Use connection pooling (already configured in knexfile.js)
- Set up proper database backups
- Configure SSL connections for production
- Use environment-specific migration and seed strategies
- Monitor database performance and add indexes as needed
