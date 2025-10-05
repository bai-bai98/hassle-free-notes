/**
 * Performance monitoring utilities
 * Track and log performance metrics
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private readonly MAX_METRICS = 100;

  /**
   * Start timing an operation
   */
  start(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing an operation and record metric
   */
  end(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`No start time found for metric: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    // Record metric
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    // Limit metrics array size
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    return duration;
  }

  /**
   * Measure a synchronous function
   */
  measure<T>(name: string, fn: () => T): T {
    this.start(name);
    try {
      return fn();
    } finally {
      this.end(name);
    }
  }

  /**
   * Get average duration for a metric
   */
  getAverage(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const names = [...new Set(this.metrics.map(m => m.name))];

    console.group('Performance Summary');
    names.forEach(name => {
      const avg = this.getAverage(name);
      const count = this.metrics.filter(m => m.name === name).length;
      console.log(`${name}: ${avg.toFixed(2)}ms (${count} samples)`);
    });
    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Check if operation is slow (over threshold)
   */
  checkThreshold(name: string, thresholdMs: number): boolean {
    const recent = this.metrics
      .filter(m => m.name === name)
      .slice(-5); // Last 5 samples

    if (recent.length === 0) return false;

    const avg = recent.reduce((acc, m) => acc + m.duration, 0) / recent.length;

    if (avg > thresholdMs) {
      console.warn(`⚠️ Performance warning: ${name} took ${avg.toFixed(2)}ms (threshold: ${thresholdMs}ms)`);
      return true;
    }

    return false;
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

// Expose in development mode
  (window as any).perfMonitor = perfMonitor;
