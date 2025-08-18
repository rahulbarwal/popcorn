import {
  setupTestDatabase,
  teardownTestDatabase,
  resetTestData,
} from "../setup/testDatabase";
import { ApiTestHelpers, PerformanceHelpers } from "../setup/testHelpers";

describe("Load Testing", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  }, 30000);

  afterAll(async () => {
    await teardownTestDatabase();
  }, 30000);

  beforeEach(async () => {
    await resetTestData();
  }, 15000);

  describe("Concurrent User Scenarios", () => {
    it("should handle 10 concurrent dashboard metric requests", async () => {
      const concurrency = 10;
      const startTime = Date.now();

      const responses = await PerformanceHelpers.runConcurrentRequests(
        () => ApiTestHelpers.getDashboardMetrics(),
        concurrency
      );

      const totalDuration = Date.now() - startTime;

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Total time should be reasonable for concurrent requests
      expect(totalDuration).toBeLessThan(10000); // 10 seconds max

      console.log(
        `✅ ${concurrency} concurrent dashboard requests completed in ${totalDuration}ms`
      );
    }, 30000);

    it("should handle 15 concurrent stock level requests with different filters", async () => {
      const requests = [
        () => ApiTestHelpers.getStockLevels(),
        () => ApiTestHelpers.getStockLevels({ warehouseId: 1 }),
        () => ApiTestHelpers.getStockLevels({ stockFilter: "low_stock" }),
        () => ApiTestHelpers.getStockLevels({ stockFilter: "out_of_stock" }),
        () => ApiTestHelpers.getStockLevels({ search: "product" }),
        () => ApiTestHelpers.getStockLevels({ category: "Electronics" }),
        () => ApiTestHelpers.getStockLevels({ page: 1, limit: 10 }),
        () => ApiTestHelpers.getStockLevels({ page: 2, limit: 10 }),
        () =>
          ApiTestHelpers.getStockLevels({ warehouseId: 1, stockFilter: "all" }),
        () =>
          ApiTestHelpers.getStockLevels({
            search: "test",
            category: "Electronics",
          }),
        () => ApiTestHelpers.getStockLevels({ warehouseId: 2 }),
        () =>
          ApiTestHelpers.getStockLevels({
            stockFilter: "all",
            page: 1,
            limit: 25,
          }),
        () => ApiTestHelpers.getStockLevels({ search: "widget" }),
        () => ApiTestHelpers.getStockLevels({ category: "Tools" }),
        () =>
          ApiTestHelpers.getStockLevels({
            warehouseId: 1,
            search: "product",
            limit: 5,
          }),
      ];

      const startTime = Date.now();
      const responses = await Promise.all(requests.map((req) => req()));
      const totalDuration = Date.now() - startTime;

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(totalDuration).toBeLessThan(15000); // 15 seconds max

      console.log(
        `✅ 15 concurrent stock level requests with different filters completed in ${totalDuration}ms`
      );
    }, 45000);

    it("should handle 8 concurrent recent purchase requests", async () => {
      const concurrency = 8;
      const startTime = Date.now();

      const responses = await PerformanceHelpers.runConcurrentRequests(
        () => ApiTestHelpers.getRecentPurchases(),
        concurrency
      );

      const totalDuration = Date.now() - startTime;

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(totalDuration).toBeLessThan(8000); // 8 seconds max

      console.log(
        `✅ ${concurrency} concurrent recent purchase requests completed in ${totalDuration}ms`
      );
    }, 20000);

    it("should handle 12 concurrent warehouse distribution requests", async () => {
      const concurrency = 12;
      const startTime = Date.now();

      const responses = await PerformanceHelpers.runConcurrentRequests(
        () => ApiTestHelpers.getWarehouseDistribution(),
        concurrency
      );

      const totalDuration = Date.now() - startTime;

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(totalDuration).toBeLessThan(12000); // 12 seconds max

      console.log(
        `✅ ${concurrency} concurrent warehouse distribution requests completed in ${totalDuration}ms`
      );
    }, 25000);

    it("should handle mixed concurrent requests simulating real usage", async () => {
      const mixedRequests = [
        // Dashboard metrics (most common)
        ...Array(5).fill(() => ApiTestHelpers.getDashboardMetrics()),
        ...Array(3).fill(() => ApiTestHelpers.getDashboardMetrics(1)),

        // Stock levels (second most common)
        ...Array(4).fill(() => ApiTestHelpers.getStockLevels()),
        ...Array(2).fill(() =>
          ApiTestHelpers.getStockLevels({ stockFilter: "low_stock" })
        ),
        ...Array(2).fill(() =>
          ApiTestHelpers.getStockLevels({ warehouseId: 1 })
        ),

        // Recent purchases
        ...Array(3).fill(() => ApiTestHelpers.getRecentPurchases()),
        ...Array(1).fill(() => ApiTestHelpers.getRecentPurchases({ limit: 5 })),

        // Warehouse distribution
        ...Array(2).fill(() => ApiTestHelpers.getWarehouseDistribution()),
        ...Array(1).fill(() =>
          ApiTestHelpers.getWarehouseDistribution({ warehouseId: 1 })
        ),

        // Suppliers
        ...Array(2).fill(() => ApiTestHelpers.getSuppliers()),
        ...Array(1).fill(() => ApiTestHelpers.getSupplierById(1)),
      ];

      const startTime = Date.now();
      const responses = await Promise.all(mixedRequests.map((req) => req()));
      const totalDuration = Date.now() - startTime;

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(totalDuration).toBeLessThan(20000); // 20 seconds max for mixed load

      console.log(
        `✅ ${mixedRequests.length} mixed concurrent requests completed in ${totalDuration}ms`
      );
      console.log(
        `📊 Average response time: ${Math.round(
          totalDuration / mixedRequests.length
        )}ms per request`
      );
    }, 45000);
  });

  describe("Database Query Performance", () => {
    it("should execute dashboard metrics query within performance threshold", async () => {
      const iterations = 5;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const { duration } = await PerformanceHelpers.measureResponseTime(() =>
          ApiTestHelpers.getDashboardMetrics()
        );
        durations.push(duration);
      }

      const averageDuration =
        durations.reduce((sum, d) => sum + d, 0) / iterations;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      expect(averageDuration).toBeLessThan(3000); // 3 second average
      expect(maxDuration).toBeLessThan(5000); // 5 second max

      console.log(`📊 Dashboard metrics query performance:`);
      console.log(`   Average: ${Math.round(averageDuration)}ms`);
      console.log(`   Min: ${minDuration}ms, Max: ${maxDuration}ms`);
    }, 30000);

    it("should execute stock levels query with pagination efficiently", async () => {
      const testCases = [
        { page: 1, limit: 10 },
        { page: 1, limit: 25 },
        { page: 1, limit: 50 },
        { page: 2, limit: 25 },
        { page: 3, limit: 10 },
      ];

      for (const testCase of testCases) {
        const { duration } = await PerformanceHelpers.measureResponseTime(() =>
          ApiTestHelpers.getStockLevels(testCase)
        );

        expect(duration).toBeLessThan(1500); // 1.5 second max per query

        console.log(
          `📊 Stock levels query (page ${testCase.page}, limit ${testCase.limit}): ${duration}ms`
        );
      }
    }, 20000);

    it("should execute complex filtered queries efficiently", async () => {
      const complexQueries = [
        () =>
          ApiTestHelpers.getStockLevels({
            warehouseId: 1,
            stockFilter: "low_stock",
            search: "product",
            category: "Electronics",
            page: 1,
            limit: 20,
          }),
        () =>
          ApiTestHelpers.getRecentPurchases({
            warehouseId: 1,
            status: "pending",
            dateFrom: "2024-01-01",
            dateTo: "2024-12-31",
            limit: 10,
          }),
        () =>
          ApiTestHelpers.getWarehouseDistribution({
            warehouseId: 1,
            category: "Electronics",
            minValue: 1000,
          }),
      ];

      for (let i = 0; i < complexQueries.length; i++) {
        const { duration } = await PerformanceHelpers.measureResponseTime(
          complexQueries[i]
        );

        expect(duration).toBeLessThan(2000); // 2 second max for complex queries

        console.log(`📊 Complex query ${i + 1}: ${duration}ms`);
      }
    }, 15000);
  });

  describe("Memory and Resource Usage", () => {
    it("should not cause memory leaks during repeated requests", async () => {
      const initialMemory = process.memoryUsage();

      // Make 50 requests to test for memory leaks
      for (let i = 0; i < 50; i++) {
        await ApiTestHelpers.getDashboardMetrics();

        // Force garbage collection every 10 requests if available
        if (i % 10 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();

      // Memory usage should not increase dramatically
      const heapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const heapIncreasePercent = (heapIncrease / initialMemory.heapUsed) * 100;

      expect(heapIncreasePercent).toBeLessThan(50); // Less than 50% increase

      console.log(`📊 Memory usage after 50 requests:`);
      console.log(
        `   Initial heap: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`
      );
      console.log(
        `   Final heap: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`
      );
      console.log(
        `   Increase: ${Math.round(heapIncrease / 1024 / 1024)}MB (${Math.round(
          heapIncreasePercent
        )}%)`
      );
    }, 60000);

    it("should handle rapid sequential requests without degradation", async () => {
      const requestCount = 20;
      const durations: number[] = [];

      for (let i = 0; i < requestCount; i++) {
        const { duration } = await PerformanceHelpers.measureResponseTime(() =>
          ApiTestHelpers.getStockLevels({ limit: 10 })
        );
        durations.push(duration);
      }

      // Check that performance doesn't degrade significantly over time
      const firstHalf = durations.slice(0, requestCount / 2);
      const secondHalf = durations.slice(requestCount / 2);

      const firstHalfAvg =
        firstHalf.reduce((sum, d) => sum + d, 0) / firstHalf.length;
      const secondHalfAvg =
        secondHalf.reduce((sum, d) => sum + d, 0) / secondHalf.length;

      const degradationPercent =
        ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

      expect(degradationPercent).toBeLessThan(25); // Less than 25% degradation

      console.log(`📊 Performance degradation analysis:`);
      console.log(`   First half average: ${Math.round(firstHalfAvg)}ms`);
      console.log(`   Second half average: ${Math.round(secondHalfAvg)}ms`);
      console.log(`   Degradation: ${Math.round(degradationPercent)}%`);
    }, 45000);
  });
});
