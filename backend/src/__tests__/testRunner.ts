#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Inventory Dashboard Backend
 *
 * This script runs all test suites and generates comprehensive reports
 * including coverage, performance metrics, and test results.
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

interface TestSuite {
  name: string;
  pattern: string;
  timeout: number;
  description: string;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  coverage?: number;
  errors?: string[];
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  private testSuites: TestSuite[] = [
    {
      name: "Unit Tests",
      pattern: "src/**/*.test.ts",
      timeout: 30000,
      description: "Individual component and service unit tests",
    },
    {
      name: "Integration Tests",
      pattern: "src/__tests__/integration/**/*.test.ts",
      timeout: 60000,
      description: "API endpoint integration tests with database",
    },
    {
      name: "Performance Tests",
      pattern: "src/__tests__/performance/**/*.ts",
      timeout: 120000,
      description: "Load testing and performance benchmarks",
    },
  ];

  async runAllTests(): Promise<void> {
    console.log("🚀 Starting Comprehensive Test Suite");
    console.log("=====================================\n");

    this.startTime = Date.now();

    // Ensure test reports directory exists
    this.ensureReportsDirectory();

    // Run each test suite
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    // Generate final report
    this.generateFinalReport();
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`📋 Running ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`   Pattern: ${suite.pattern}`);
    console.log(`   Timeout: ${suite.timeout}ms\n`);

    const startTime = Date.now();

    try {
      const jestCommand = this.buildJestCommand(suite);

      console.log(`   Executing: ${jestCommand}\n`);

      const output = execSync(jestCommand, {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: "pipe",
        timeout: suite.timeout,
      });

      const duration = Date.now() - startTime;

      // Parse Jest output for results
      const result = this.parseJestOutput(output, suite.name, duration);
      this.results.push(result);

      console.log(`✅ ${suite.name} completed in ${duration}ms\n`);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      console.log(`❌ ${suite.name} failed after ${duration}ms`);
      console.log(`   Error: ${error.message}\n`);

      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        errors: [error.message],
      });
    }
  }

  private buildJestCommand(suite: TestSuite): string {
    const baseCommand = "npx jest";
    const options = [
      `--testPathPattern="${suite.pattern}"`,
      "--verbose",
      "--coverage",
      "--coverageReporters=text,lcov,html",
      `--coverageDirectory=coverage/${suite.name
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
      "--detectOpenHandles",
      "--forceExit",
      `--testTimeout=${suite.timeout}`,
    ];

    return `${baseCommand} ${options.join(" ")}`;
  }

  private parseJestOutput(
    output: string,
    suiteName: string,
    duration: number
  ): TestResult {
    const lines = output.split("\n");

    // Look for test results summary
    const testResultLine = lines.find((line) => line.includes("Tests:"));
    const coverageLine = lines.find((line) => line.includes("All files"));

    let passed = true;
    let coverage = 0;
    const errors: string[] = [];

    if (testResultLine) {
      passed =
        !testResultLine.includes("failed") && !testResultLine.includes("error");

      if (!passed) {
        // Extract error information
        const errorLines = lines.filter(
          (line) =>
            line.includes("FAIL") ||
            line.includes("Error:") ||
            line.includes("Expected:")
        );
        errors.push(...errorLines);
      }
    }

    if (coverageLine) {
      const coverageMatch = coverageLine.match(/(\d+\.?\d*)%/);
      if (coverageMatch) {
        coverage = parseFloat(coverageMatch[1]);
      }
    }

    return {
      suite: suiteName,
      passed,
      duration,
      coverage,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private ensureReportsDirectory(): void {
    const reportsDir = path.join(process.cwd(), "test-reports");
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }
  }

  private generateFinalReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter((r) => r.passed).length;
    const totalTests = this.results.length;
    const overallPassed = passedTests === totalTests;

    console.log("\n📊 Test Results Summary");
    console.log("=======================");
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Test Suites: ${passedTests}/${totalTests} passed`);
    console.log(
      `Overall Status: ${overallPassed ? "✅ PASSED" : "❌ FAILED"}\n`
    );

    // Detailed results
    this.results.forEach((result) => {
      const status = result.passed ? "✅" : "❌";
      const coverage = result.coverage ? ` (${result.coverage}% coverage)` : "";

      console.log(`${status} ${result.suite}: ${result.duration}ms${coverage}`);

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error) => {
          console.log(`   Error: ${error}`);
        });
      }
    });

    // Generate JSON report
    this.generateJSONReport(totalDuration, overallPassed);

    // Generate HTML report
    this.generateHTMLReport(totalDuration, overallPassed);

    console.log("\n📄 Reports generated:");
    console.log("   - test-reports/results.json");
    console.log("   - test-reports/results.html");
    console.log("   - coverage/ (HTML coverage reports)");

    // Exit with appropriate code
    process.exit(overallPassed ? 0 : 1);
  }

  private generateJSONReport(
    totalDuration: number,
    overallPassed: boolean
  ): void {
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      overallPassed,
      summary: {
        totalSuites: this.results.length,
        passedSuites: this.results.filter((r) => r.passed).length,
        failedSuites: this.results.filter((r) => !r.passed).length,
      },
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    const reportPath = path.join(process.cwd(), "test-reports", "results.json");
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  private generateHTMLReport(
    totalDuration: number,
    overallPassed: boolean
  ): void {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Dashboard - Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
        .passed { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .failed { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        .suite-header { font-weight: bold; margin-bottom: 10px; }
        .suite-passed { border-left: 4px solid #28a745; }
        .suite-failed { border-left: 4px solid #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { padding: 15px; background: #f8f9fa; border-radius: 4px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 14px; color: #6c757d; }
        .errors { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .timestamp { color: #6c757d; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Inventory Dashboard API - Test Results</h1>
            <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="status ${overallPassed ? "passed" : "failed"}">
            <h2>${
              overallPassed ? "✅ All Tests Passed" : "❌ Some Tests Failed"
            }</h2>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${totalDuration}ms</div>
                <div class="metric-label">Total Duration</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.results.length}</div>
                <div class="metric-label">Test Suites</div>
            </div>
            <div class="metric">
                <div class="metric-value">${
                  this.results.filter((r) => r.passed).length
                }</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${
                  this.results.filter((r) => !r.passed).length
                }</div>
                <div class="metric-label">Failed</div>
            </div>
        </div>
        
        <h3>Test Suite Results</h3>
        ${this.results
          .map(
            (result) => `
            <div class="suite ${
              result.passed ? "suite-passed" : "suite-failed"
            }">
                <div class="suite-header">
                    ${result.passed ? "✅" : "❌"} ${result.suite}
                </div>
                <div>Duration: ${result.duration}ms</div>
                ${
                  result.coverage
                    ? `<div>Coverage: ${result.coverage}%</div>`
                    : ""
                }
                ${
                  result.errors && result.errors.length > 0
                    ? `
                    <div class="errors">
                        <strong>Errors:</strong>
                        <ul>
                            ${result.errors
                              .map((error) => `<li>${error}</li>`)
                              .join("")}
                        </ul>
                    </div>
                `
                    : ""
                }
            </div>
        `
          )
          .join("")}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #6c757d; font-size: 12px;">
            <p>Environment: Node.js ${process.version} on ${process.platform} ${
      process.arch
    }</p>
            <p>Generated by Inventory Dashboard Test Runner</p>
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(process.cwd(), "test-reports", "results.html");
    writeFileSync(reportPath, html);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch((error) => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  });
}

export { TestRunner };
