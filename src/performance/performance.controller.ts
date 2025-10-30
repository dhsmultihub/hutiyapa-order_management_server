import { Controller, Get, Post, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
// Define UserRole enum since it's not in Prisma schema
enum UserRole {
    ADMIN = 'ADMIN',
    EMPLOYEE = 'EMPLOYEE',
    CUSTOMER = 'CUSTOMER',
}
import { PerformanceMonitorService } from './performance-monitor.service';

@ApiTags('Performance')
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PerformanceController {
    private readonly logger = new Logger(PerformanceController.name);

    constructor(private readonly performanceMonitor: PerformanceMonitorService) { }

    @Get('metrics/current')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get current performance metrics' })
    @ApiResponse({ status: 200, description: 'Current metrics retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getCurrentMetrics(@CurrentUser() user: any) {
        return this.performanceMonitor.getCurrentMetrics();
    }

    @Get('metrics/history')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get performance metrics history' })
    @ApiResponse({ status: 200, description: 'Metrics history retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getMetricsHistory(@CurrentUser() user: any) {
        return this.performanceMonitor.getMetricsHistory();
    }

    @Get('metrics/average')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get average performance metrics' })
    @ApiResponse({ status: 200, description: 'Average metrics retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getAverageMetrics(@CurrentUser() user: any) {
        return this.performanceMonitor.getAverageMetrics();
    }

    @Get('memory')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get memory statistics' })
    @ApiResponse({ status: 200, description: 'Memory stats retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getMemoryStats(@CurrentUser() user: any) {
        return {
            memory: this.performanceMonitor.getMemoryStats(),
            heap: this.performanceMonitor.getHeapStatistics(),
            heapSpaces: this.performanceMonitor.getHeapSpaceStatistics(),
        };
    }

    @Get('system')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get system statistics' })
    @ApiResponse({ status: 200, description: 'System stats retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getSystemStats(@CurrentUser() user: any) {
        return this.performanceMonitor.getSystemStats();
    }

    @Get('recommendations')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get performance recommendations' })
    @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getRecommendations(@CurrentUser() user: any) {
        return {
            recommendations: this.performanceMonitor.getRecommendations(),
            timestamp: new Date(),
        };
    }

    @Post('gc/force')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Force garbage collection' })
    @ApiResponse({ status: 200, description: 'Garbage collection triggered' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async forceGarbageCollection(@CurrentUser() user: any) {
        const success = this.performanceMonitor.forceGarbageCollection();
        return {
            success,
            message: success
                ? 'Garbage collection completed successfully'
                : 'Garbage collection not available. Start Node.js with --expose-gc flag.',
            metrics: this.performanceMonitor.getMemoryStats(),
        };
    }

    @Post('metrics/clear')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Clear metrics history' })
    @ApiResponse({ status: 200, description: 'Metrics history cleared' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async clearMetrics(@CurrentUser() user: any) {
        this.performanceMonitor.clearMetrics();
        return { message: 'Metrics history cleared successfully' };
    }
}

