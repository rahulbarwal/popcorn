#!/usr/bin/env node

/**
 * Comprehensive Frontend Test Runner for Inventory Dashboard
 *
 * This script runs all frontend test suites and generates comprehensive reports
 * including coverage, accessibility, visual regression, and cross-browser compatibility.
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

interface TestSuite {
  name: string;
  command: string;
  timeout: number;
  description: string;
  critical: boolean;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  coverage?: number;
  errors?: string[];
  critical: boolean;
}

class FrontendTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  private testSuites: TestSuite[] = [
    {
      name: "Component Unit Tests",
      command: "npm run test:components",
      timeout: 60000,
      description: "Individual React component unit tests",
      critical: true,
    },
    {
      name: "End-to-End Workflow Tests",
      command: "npm run test:e2e",
      timeout: 120000,
      description: "Complete user workflow integration tests",
      critical: true,
    },
    {
      name: "Accessibility Tests",
      command: "npm run test:accessibility",
      timeout: 90000,
      description: "WCAG compliance and accessibility validation",
      critical: true,
    },
    {
      name: "Visual Regression Tests",
      command: "npm run test:visual",
      timeout: 180000,
      description: "Component visual consistency validation",
      critical: false,
    },
    {
      name: "Cross-Browser Compatibility",
      command: "npm run test:cross-browser",
      timeout: 150000,
      description: "Browser compatibility and feature detection",
      critical: false,
    },
    {
      name: "Coverage Report",
      command: "npm run test:coverage",
      timeout: 90000,
      description: "Code coverage analysis and reporting",
      critical: true,
    },
  ];

  async runAllTests(): Promise<void> {
    console.log("🚀 Starting Comprehensive Frontend Test Suite");
    console.log("==============================================\n");

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
    console.log(`   Command: ${suite.command}`);
    console.log(`   Timeout: ${suite.timeout}ms`);
    console.log(`   Critical: ${suite.critical ? "Yes" : "No"}\n`);

    const startTime = Date.now();

    try {
      const output = execSync(suite.command, {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: "pipe",
        timeout: suite.timeout,
      });

      const duration = Date.now() - startTime;

      // Parse test output for results
      const result = this.parseTestOutput(
        output,
        suite.name,
        duration,
        suite.critical
      );
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
        critical: suite.critical,
      });
    }
  }

  private parseTestOutput(
    output: string,
    suiteName: string,
    duration: number,
    critical: boolean
  ): TestResult {
    const lines = output.split("\n");

    // Look for test results summary
    const testResultLine = lines.find(
      (line) =>
        line.includes("Test Files") ||
        line.includes("Tests") ||
        line.includes("✓") ||
        line.includes("✗")
    );

    const coverageLine = lines.find(
      (line) => line.includes("All files") || line.includes("Coverage")
    );

    let passed = true;
    let coverage = 0;
    const errors: string[] = [];

    if (testResultLine) {
      passed =
        !testResultLine.includes("failed") &&
        !testResultLine.includes("✗") &&
        !output.includes("FAIL");

      if (!passed) {
        // Extract error information
        const errorLines = lines.filter(
          (line) =>
            line.includes("FAIL") ||
            line.includes("Error:") ||
            line.includes("Expected:") ||
            line.includes("✗")
        );
        errors.push(...errorLines.slice(0, 5)); // Limit to first 5 errors
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
      coverage: coverage > 0 ? coverage : undefined,
      errors: errors.length > 0 ? errors : undefined,
      critical,
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
    const criticalTests = this.results.filter((r) => r.critical);
    const criticalPassed = criticalTests.filter((r) => r.passed).length;
    const overallPassed = criticalPassed === criticalTests.length;

    console.log("\n📊 Frontend Test Results Summary");
    console.log("=================================");
    console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`Test Suites: ${passedTests}/${totalTests} passed`);
    console.log(
      `Critical Tests: ${criticalPassed}/${criticalTests.length} passed`
    );
    console.log(
      `Overall Status: ${overallPassed ? "✅ PASSED" : "❌ FAILED"}\n`
    );

    // Detailed results
    this.results.forEach((result) => {
      const status = result.passed ? "✅" : "❌";
      const critical = result.critical ? " (Critical)" : "";
      const coverage = result.coverage ? ` (${result.coverage}% coverage)` : "";
      const duration = Math.round(result.duration / 1000);

      console.log(
        `${status} ${result.suite}${critical}: ${duration}s${coverage}`
      );

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error) => {
          console.log(`   Error: ${error.substring(0, 100)}...`);
        });
      }
    });

    // Generate JSON report
    this.generateJSONReport(totalDuration, overallPassed);

    // Generate HTML report
    this.generateHTMLReport(totalDuration, overallPassed);

    // Generate coverage badge
    this.generateCoverageBadge();

    console.log("\n📄 Reports generated:");
    console.log("   - test-reports/frontend-results.json");
    console.log("   - test-reports/frontend-results.html");
    console.log("   - test-reports/coverage-badge.svg");
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
        criticalSuites: this.results.filter((r) => r.critical).length,
        criticalPassed: this.results.filter((r) => r.critical && r.passed)
          .length,
      },
      results: this.results,
      coverage: {
        average: this.calculateAverageCoverage(),
        threshold: 80,
        passed: this.calculateAverageCoverage() >= 80,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        ci: process.env.CI === "true",
      },
    };

    const reportPath = path.join(
      process.cwd(),
      "test-reports",
      "frontend-results.json"
    );
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  private generateHTMLReport(
    totalDuration: number,
    overallPassed: boolean
  ): void {
    const averageCoverage = this.calculateAverageCoverage();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frontend Test Results - Inventory Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .status { padding: 15px; border-radius: 8px; margin: 20px 0; font-weight: 600; }
        .passed { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .failed { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .suite { margin: 25px 0; padding: 20px; border: 1px solid #e1e5e9; border-radius: 8px; }
        .suite-header { font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
        .suite-passed { border-left: 4px solid #28a745; }
        .suite-failed { border-left: 4px solid #dc3545; }
        .suite-critical { background: #fff3cd; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric { padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 28px; font-weight: 700; color: #007bff; margin-bottom: 5px; }
        .metric-label { font-size: 14px; color: #6c757d; }
        .errors { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-top: 15px; }
        .error-item { font-family: monospace; font-size: 12px; margin: 5px 0; }
        .timestamp { color: #6c757d; font-size: 12px; text-align: center; margin-top: 30px; }
        .coverage-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .badge-critical { background: #dc3545; color: white; }
        .badge-optional { background: #6c757d; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Frontend Test Results</h1>
            <h2>Inventory Dashboard Application</h2>
            <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="status ${overallPassed ? "passed" : "failed"}">
            <h2>${
              overallPassed
                ? "✅ All Critical Tests Passed"
                : "❌ Some Critical Tests Failed"
            }</h2>
            <p>Test execution completed in ${Math.round(
              totalDuration / 1000
            )} seconds</p>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${Math.round(
                  totalDuration / 1000
                )}s</div>
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
            <div class="metric">
                <div class="metric-value">${averageCoverage.toFixed(1)}%</div>
                <div class="metric-label">Average Coverage</div>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${averageCoverage}%"></div>
                </div>
            </div>
        </div>
        
        <h3>📋 Test Suite Results</h3>
        ${this.results
          .map(
            (result) => `
            <div class="suite ${
              result.passed ? "suite-passed" : "suite-failed"
            } ${result.critical ? "suite-critical" : ""}">
                <div class="suite-header">
                    ${result.passed ? "✅" : "❌"} ${result.suite}
                    <span class="badge ${
                      result.critical ? "badge-critical" : "badge-optional"
                    }">
                        ${result.critical ? "Critical" : "Optional"}
                    </span>
                </div>
                <div>Duration: ${Math.round(result.duration / 1000)}s</div>
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
                        ${result.errors
                          .map(
                            (error) => `<div class="error-item">${error}</div>`
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
            </div>
        `
          )
          .join("")}
        
        <div class="timestamp">
            <p><strong>Environment:</strong> Node.js ${process.version} on ${
      process.platform
    } ${process.arch}</p>
            <p><strong>CI:</strong> ${
              process.env.CI === "true" ? "Yes" : "No"
            }</p>
            <p>Generated by Inventory Dashboard Frontend Test Runner</p>
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(
      process.cwd(),
      "test-reports",
      "frontend-results.html"
    );
    writeFileSync(reportPath, html);
  }

  private generateCoverageBadge(): void {
    const coverage = this.calculateAverageCoverage();
    const color =
      coverage >= 80 ? "brightgreen" : coverage >= 60 ? "yellow" : "red";

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="104" height="20">
    <linearGradient id="b" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <mask id="a">
        <rect width="104" height="20" rx="3" fill="#fff"/>
    </mask>
    <g mask="url(#a)">
        <path fill="#555" d="M0 0h63v20H0z"/>
        <path fill="${color}" d="M63 0h41v20H63z"/>
        <path fill="url(#b)" d="M0 0h104v20H0z"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="31.5" y="15" fill="#010101" fill-opacity=".3">coverage</text>
        <text x="31.5" y="14">coverage</text>
        <text x="82.5" y="15" fill="#010101" fill-opacity=".3">${coverage.toFixed(
          0
        )}%</text>
        <text x="82.5" y="14">${coverage.toFixed(0)}%</text>
    </g>
</svg>`;

    const badgePath = path.join(
      process.cwd(),
      "test-reports",
      "coverage-badge.svg"
    );
    writeFileSync(badgePath, svg.trim());
  }

  private calculateAverageCoverage(): number {
    const coverageResults = this.results.filter(
      (r) => r.coverage !== undefined
    );
    if (coverageResults.length === 0) return 0;

    const totalCoverage = coverageResults.reduce(
      (sum, r) => sum + (r.coverage || 0),
      0
    );
    return totalCoverage / coverageResults.length;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new FrontendTestRunner();
  runner.runAllTests().catch((error) => {
    console.error("❌ Frontend test runner failed:", error);
    process.exit(1);
  });
}

export { FrontendTestRunner };
