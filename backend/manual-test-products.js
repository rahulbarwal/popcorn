/**
 * Manual test script for Product Management API endpoints
 * Run this with: node manual-test-products.js
 *
 * Make sure the server is running on port 3001
 */

const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";

async function testProductsAPI() {
  console.log("🧪 Testing Product Management API Endpoints\n");

  try {
    // Test 1: Get all products
    console.log("1. Testing GET /api/products");
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    console.log("✅ GET /api/products - Success");
    console.log(
      `   Found ${productsResponse.data.data.products.length} products\n`
    );

    // Test 2: Get categories
    console.log("2. Testing GET /api/products/categories");
    const categoriesResponse = await axios.get(
      `${BASE_URL}/products/categories`
    );
    console.log("✅ GET /api/products/categories - Success");
    console.log(
      `   Found categories: ${categoriesResponse.data.data.categories.join(
        ", "
      )}\n`
    );

    // Test 3: Get warehouses
    console.log("3. Testing GET /api/warehouses");
    const warehousesResponse = await axios.get(`${BASE_URL}/warehouses`);
    console.log("✅ GET /api/warehouses - Success");
    console.log(
      `   Found ${warehousesResponse.data.data.warehouses.length} warehouses\n`
    );

    // Test 4: Validate SKU (should be available)
    console.log("4. Testing GET /api/products/validate-sku/NEW-TEST-SKU");
    const skuValidationResponse = await axios.get(
      `${BASE_URL}/products/validate-sku/NEW-TEST-SKU`
    );
    console.log("✅ GET /api/products/validate-sku - Success");
    console.log(
      `   SKU validation result: ${
        skuValidationResponse.data.data.is_valid ? "Available" : "Taken"
      }\n`
    );

    // Test 5: Create a new product
    console.log("5. Testing POST /api/products");
    const newProduct = {
      name: "Test Product API",
      sku: "TEST-API-001",
      description: "Test product created via API",
      category: "Electronics",
      cost_price: 25.5,
      sale_price: 45.99,
      reorder_point: 50,
      warehouse_stock: [{ warehouse_id: 1, initial_quantity: 100 }],
    };

    const createResponse = await axios.post(`${BASE_URL}/products`, newProduct);
    console.log("✅ POST /api/products - Success");
    const createdProductId = createResponse.data.data.product.id;
    console.log(`   Created product with ID: ${createdProductId}\n`);

    // Test 6: Get product by ID
    console.log(`6. Testing GET /api/products/${createdProductId}`);
    const productDetailResponse = await axios.get(
      `${BASE_URL}/products/${createdProductId}`
    );
    console.log("✅ GET /api/products/:id - Success");
    console.log(
      `   Product name: ${productDetailResponse.data.data.product.name}\n`
    );

    // Test 7: Update product
    console.log(`7. Testing PUT /api/products/${createdProductId}`);
    const updateData = {
      name: "Updated Test Product API",
      sale_price: 49.99,
    };
    const updateResponse = await axios.put(
      `${BASE_URL}/products/${createdProductId}`,
      updateData
    );
    console.log("✅ PUT /api/products/:id - Success");
    console.log(
      `   Updated product name: ${updateResponse.data.data.product.name}\n`
    );

    // Test 8: Inline field update
    console.log(`8. Testing PATCH /api/products/${createdProductId}/inline`);
    const inlineUpdateData = {
      field: "reorder_point",
      value: 75,
    };
    const inlineUpdateResponse = await axios.patch(
      `${BASE_URL}/products/${createdProductId}/inline`,
      inlineUpdateData
    );
    console.log("✅ PATCH /api/products/:id/inline - Success");
    console.log(
      `   Updated reorder point to: ${inlineUpdateResponse.data.data.product.new_value}\n`
    );

    // Test 9: Bulk field update
    console.log(`9. Testing PUT /api/products/${createdProductId}/fields`);
    const bulkUpdateData = {
      fields: {
        cost_price: 27.0,
        sale_price: 52.99,
      },
    };
    const bulkUpdateResponse = await axios.put(
      `${BASE_URL}/products/${createdProductId}/fields`,
      bulkUpdateData
    );
    console.log("✅ PUT /api/products/:id/fields - Success");
    console.log(`   Updated multiple fields successfully\n`);

    // Test 10: Search products
    console.log("10. Testing GET /api/products with search filter");
    const searchResponse = await axios.get(`${BASE_URL}/products?search=Test`);
    console.log("✅ GET /api/products?search=Test - Success");
    console.log(
      `   Found ${searchResponse.data.data.products.length} products matching "Test"\n`
    );

    // Test 11: Filter by category
    console.log("11. Testing GET /api/products with category filter");
    const categoryFilterResponse = await axios.get(
      `${BASE_URL}/products?category=Electronics`
    );
    console.log("✅ GET /api/products?category=Electronics - Success");
    console.log(
      `   Found ${categoryFilterResponse.data.data.products.length} Electronics products\n`
    );

    // Test 12: Delete product
    console.log(`12. Testing DELETE /api/products/${createdProductId}`);
    const deleteResponse = await axios.delete(
      `${BASE_URL}/products/${createdProductId}`
    );
    console.log("✅ DELETE /api/products/:id - Success");
    console.log(`   Deleted product successfully\n`);

    // Test 13: Verify product is deleted
    console.log(`13. Verifying product deletion`);
    try {
      await axios.get(`${BASE_URL}/products/${createdProductId}`);
      console.log("❌ Product should have been deleted");
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("✅ Product deletion verified - 404 as expected\n");
      } else {
        throw error;
      }
    }

    console.log("🎉 All Product Management API tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the tests
testProductsAPI();
