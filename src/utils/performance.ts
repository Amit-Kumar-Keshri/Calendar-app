// Performance monitoring and optimization utilities

import { PERFORMANCE_CONFIG } from "./constants";

/**
 * Debounce function to limit the rate of function calls
 */
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function to ensure a function is called at most once per specified interval
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Performance timing utility
 */
export class PerformanceTimer {
  private startTime: number = 0;
  private label: string;

  constructor(label: string) {
    this.label = label;
  }

  start(): void {
    this.startTime = performance.now();
  }

  end(): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    console.log(`${this.label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    const timer = new PerformanceTimer(label);
    timer.start();
    const result = fn();
    timer.end();
    return result;
  }
}

/**
 * Memory usage monitoring
 */
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export const getMemoryUsage = (): MemoryInfo | null => {
  if ("memory" in performance) {
    return (performance as unknown as { memory: MemoryInfo }).memory;
  }
  return null;
};

/**
 * Logs memory usage for debugging
 */
export const logMemoryUsage = (label: string = "Memory Usage"): void => {
  const memory = getMemoryUsage();
  if (memory) {
    console.log(`${label}:`, {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });
  }
};

/**
 * Creates a memoization function for expensive computations
 */
export const memoize = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxCacheSize: number = PERFORMANCE_CONFIG.CACHE_SIZE_LIMIT
): T => {
  const cache = new Map();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args) as ReturnType<T>;

    // Limit cache size
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Checks if the application is running in a performance-constrained environment
 */
export const isLowPerformanceDevice = (): boolean => {
  // Check for indicators of low-performance devices
  const navigator = window.navigator;

  // Check for hardware concurrency (number of CPU cores)
  const lowCPU =
    navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

  // Check for connection type (if available)
  const connection = (
    navigator as unknown as {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;
  const slowConnection =
    connection &&
    (connection.effectiveType === "slow-2g" ||
      connection.effectiveType === "2g" ||
      connection.saveData);

  // Check memory (if available)
  const memory = getMemoryUsage();
  const lowMemory = memory && memory.jsHeapSizeLimit < 2 * 1024 * 1024 * 1024; // Less than 2GB

  return Boolean(lowCPU || slowConnection || lowMemory);
};

/**
 * Performance optimization settings based on device capabilities
 */
export const getOptimizationSettings = () => {
  const isLowPerf = isLowPerformanceDevice();

  return {
    enableAnimations: !isLowPerf,
    cacheSize: isLowPerf ? 100 : PERFORMANCE_CONFIG.CACHE_SIZE_LIMIT,
    debounceDelay: isLowPerf ? 500 : PERFORMANCE_CONFIG.DEBOUNCE_DELAY,
    maxEventsPerView: isLowPerf ? 50 : 200,
    enableProfiling: !isLowPerf,
  };
};
