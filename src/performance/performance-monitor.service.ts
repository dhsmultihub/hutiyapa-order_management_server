import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as os from 'os';
import * as v8 from 'v8';

export interface MemoryStats {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    heapUsagePercent: number;
}

export interface SystemStats {
    cpuUsage: number;
    freeMemory: number;
    totalMemory: number;
    memoryUsagePercent: number;
    uptime: number;
    loadAverage: number[];
}

export interface PerformanceMetrics {
    memory: MemoryStats;
    system: SystemStats;
    timestamp: Date;
}

@Injectable()
export class PerformanceMonitorService {
    private readonly logger = new Logger(PerformanceMonitorService.name);
    private metrics: PerformanceMetrics[] = [];
    private readonly maxMetricsHistory = 100;

    // Monitor memory usage every 5 minutes
    @Cron(CronExpression.EVERY_5_MINUTES)
    async monitorMemoryUsage() {
        const memStats = this.getMemoryStats();

        // Warn if memory usage is high
        if (memStats.heapUsagePercent > 80) {
            this.logger.warn(`High memory usage: ${memStats.heapUsagePercent.toFixed(2)}% (${memStats.heapUsedMB}MB / ${memStats.heapTotalMB}MB)`);

            // Force garbage collection if available
            if (global.gc && memStats.heapUsagePercent > 90) {
                this.logger.warn('Forcing garbage collection...');
                global.gc();
            }
        }

        // Store metrics
        const systemStats = this.getSystemStats();
        this.metrics.push({
            memory: memStats,
            system: systemStats,
            timestamp: new Date(),
        });

        // Keep only last N metrics
        if (this.metrics.length > this.maxMetricsHistory) {
            this.metrics = this.metrics.slice(-this.maxMetricsHistory);
        }
    }

    getMemoryStats(): MemoryStats {
        const memUsage = process.memoryUsage();

        return {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss,
            heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
            rssMB: Math.round(memUsage.rss / 1024 / 1024),
            heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        };
    }

    getSystemStats(): SystemStats {
        const cpuUsage = process.cpuUsage();
        const totalCpuTime = cpuUsage.user + cpuUsage.system;
        const uptime = process.uptime();
        const cpuPercent = (totalCpuTime / 1000 / uptime) / os.cpus().length;

        return {
            cpuUsage: cpuPercent,
            freeMemory: os.freemem(),
            totalMemory: os.totalmem(),
            memoryUsagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
            uptime: uptime,
            loadAverage: os.loadavg(),
        };
    }

    getHeapStatistics() {
        return v8.getHeapStatistics();
    }

    getHeapSpaceStatistics() {
        return v8.getHeapSpaceStatistics();
    }

    getCurrentMetrics(): PerformanceMetrics {
        return {
            memory: this.getMemoryStats(),
            system: this.getSystemStats(),
            timestamp: new Date(),
        };
    }

    getMetricsHistory(): PerformanceMetrics[] {
        return [...this.metrics];
    }

    getAverageMetrics(): {
        avgHeapUsageMB: number;
        avgHeapUsagePercent: number;
        avgCpuUsage: number;
        avgMemoryUsagePercent: number;
    } {
        if (this.metrics.length === 0) {
            return {
                avgHeapUsageMB: 0,
                avgHeapUsagePercent: 0,
                avgCpuUsage: 0,
                avgMemoryUsagePercent: 0,
            };
        }

        const sum = this.metrics.reduce((acc, metric) => ({
            heapUsedMB: acc.heapUsedMB + metric.memory.heapUsedMB,
            heapUsagePercent: acc.heapUsagePercent + metric.memory.heapUsagePercent,
            cpuUsage: acc.cpuUsage + metric.system.cpuUsage,
            memoryUsagePercent: acc.memoryUsagePercent + metric.system.memoryUsagePercent,
        }), {
            heapUsedMB: 0,
            heapUsagePercent: 0,
            cpuUsage: 0,
            memoryUsagePercent: 0,
        });

        const count = this.metrics.length;
        return {
            avgHeapUsageMB: sum.heapUsedMB / count,
            avgHeapUsagePercent: sum.heapUsagePercent / count,
            avgCpuUsage: sum.cpuUsage / count,
            avgMemoryUsagePercent: sum.memoryUsagePercent / count,
        };
    }

    // Trigger garbage collection manually (requires --expose-gc flag)
    forceGarbageCollection(): boolean {
        if (global.gc) {
            const before = this.getMemoryStats();
            global.gc();
            const after = this.getMemoryStats();

            const freed = before.heapUsedMB - after.heapUsedMB;
            this.logger.log(`Garbage collection completed. Freed ${freed}MB`);
            return true;
        }

        this.logger.warn('Garbage collection not available. Start Node.js with --expose-gc flag.');
        return false;
    }

    // Get performance recommendations
    getRecommendations(): string[] {
        const recommendations: string[] = [];
        const current = this.getCurrentMetrics();
        const averages = this.getAverageMetrics();

        // Memory recommendations
        if (averages.avgHeapUsagePercent > 80) {
            recommendations.push('High average heap usage detected. Consider increasing heap size or optimizing memory usage.');
        }

        if (current.memory.heapUsagePercent > 90) {
            recommendations.push('Critical heap usage! Immediate optimization needed.');
        }

        // CPU recommendations
        if (averages.avgCpuUsage > 70) {
            recommendations.push('High CPU usage detected. Consider optimizing CPU-intensive operations or scaling horizontally.');
        }

        // System memory recommendations
        if (averages.avgMemoryUsagePercent > 85) {
            recommendations.push('System memory usage is high. Consider adding more RAM or optimizing memory usage.');
        }

        // Load average recommendations
        const loadAvg = current.system.loadAverage[0];
        const cpuCount = os.cpus().length;
        if (loadAvg > cpuCount * 0.7) {
            recommendations.push(`High load average (${loadAvg.toFixed(2)}). System may be overloaded.`);
        }

        if (recommendations.length === 0) {
            recommendations.push('All performance metrics are within acceptable ranges.');
        }

        return recommendations;
    }

    // Clear metrics history
    clearMetrics() {
        this.metrics = [];
    }
}

