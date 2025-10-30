import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    Logger,
    ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
import { SearchService } from './services/search.service';
import { FilterService } from './services/filter.service';
import { QueryBuilderService } from './services/query-builder.service';
import { SearchIndexingService } from './services/search-indexing.service';
import {
    SearchQueryDto,
    SearchResultDto,
    SearchSuggestionDto,
    SearchFacetDto,
    AdvancedSearchDto,
    SearchStatsDto,
    SearchField,
} from './dto/search-query.dto';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SearchController {
    private readonly logger = new Logger(SearchController.name);

    constructor(
        private readonly searchService: SearchService,
        private readonly filterService: FilterService,
        private readonly queryBuilder: QueryBuilderService,
        private readonly searchIndexing: SearchIndexingService,
    ) { }

    @Post('orders')
    @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Search orders' })
    @ApiResponse({ status: 200, description: 'Search results retrieved successfully', type: SearchResultDto })
    @ApiResponse({ status: 400, description: 'Invalid search query' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async searchOrders(
        @Body(ValidationPipe) searchQuery: SearchQueryDto,
        @CurrentUser() user: any,
    ): Promise<SearchResultDto> {
        this.logger.log(`Searching orders for user ${user.sub}: ${searchQuery.query || 'filtered search'}`);

        // Validate query
        const validation = this.queryBuilder.validateQuery(searchQuery);
        if (!validation.isValid) {
            throw new Error(`Invalid search query: ${validation.errors.join(', ')}`);
        }

        return this.searchService.search(searchQuery);
    }

    @Post('orders/advanced')
    @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
    @ApiOperation({ summary: 'Advanced search orders' })
    @ApiResponse({ status: 200, description: 'Advanced search results retrieved successfully', type: SearchResultDto })
    @ApiResponse({ status: 400, description: 'Invalid advanced search query' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async advancedSearchOrders(
        @Body(ValidationPipe) advancedSearch: AdvancedSearchDto,
        @CurrentUser() user: any,
    ): Promise<SearchResultDto> {
        this.logger.log(`Advanced search orders for user ${user.sub}: ${advancedSearch.query}`);

        // Convert advanced search to regular search query
        const searchQuery: SearchQueryDto = {
            query: advancedSearch.query,
            searchFields: advancedSearch.fields,
            filters: advancedSearch.filters,
            sort: advancedSearch.sort,
            page: advancedSearch.pagination?.page || 1,
            limit: advancedSearch.pagination?.limit || 20,
            includeTotal: advancedSearch.options?.includeTotal || true,
            highlight: advancedSearch.options?.highlight || false,
            fuzzySearch: advancedSearch.options?.fuzzySearch || false,
            fuzzyThreshold: advancedSearch.options?.fuzzyThreshold || 0.7,
        };

        return this.searchService.search(searchQuery);
    }

    @Get('suggestions')
    @ApiOperation({ summary: 'Get search suggestions' })
    @ApiQuery({ name: 'q', description: 'Search query', example: 'order' })
    @ApiQuery({ name: 'limit', description: 'Number of suggestions', required: false, example: 10 })
    @ApiResponse({ status: 200, description: 'Search suggestions retrieved successfully', type: [SearchSuggestionDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getSuggestions(
        @CurrentUser() user: any,
        @Query('q') query: string,
        @Query('limit') limit?: number,
    ): Promise<SearchSuggestionDto[]> {
        this.logger.log(`Getting search suggestions for query: ${query}`);

        if (!query || query.trim().length < 2) {
            return [];
        }

        return this.searchService.getSuggestions(query, limit || 10);
    }

    @Get('facets')
    @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
    @ApiOperation({ summary: 'Get search facets' })
    @ApiQuery({ name: 'fields', description: 'Facet fields', required: false, example: 'status,paymentStatus' })
    @ApiResponse({ status: 200, description: 'Search facets retrieved successfully', type: [SearchFacetDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getFacets(
        @CurrentUser() user: any,
        @Query('fields') fields?: string,
    ): Promise<SearchFacetDto[]> {
        this.logger.log(`Getting search facets for fields: ${fields}`);

        const facetFields = fields
            ? fields.split(',').map(f => f.trim() as SearchField)
            : [SearchField.STATUS, SearchField.PAYMENT_STATUS, SearchField.FULFILLMENT_STATUS];

        // Mock implementation - in real implementation, this would query the database
        const facets: SearchFacetDto[] = [];

        for (const field of facetFields) {
            const facet: SearchFacetDto = {
                field,
                type: 'terms',
                values: [
                    { value: 'PENDING', count: 15 },
                    { value: 'CONFIRMED', count: 25 },
                    { value: 'PROCESSING', count: 20 },
                    { value: 'SHIPPED', count: 18 },
                    { value: 'DELIVERED', count: 30 },
                    { value: 'CANCELLED', count: 5 },
                ],
            };
            facets.push(facet);
        }

        return facets;
    }

    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
    @ApiOperation({ summary: 'Get search statistics' })
    @ApiResponse({ status: 200, description: 'Search statistics retrieved successfully', type: SearchStatsDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getSearchStats(@CurrentUser() user: any): Promise<SearchStatsDto> {
        this.logger.log(`Getting search statistics for user ${user.sub}`);

        return this.searchService.getSearchStats();
    }

    @Get('operators')
    @ApiOperation({ summary: 'Get supported filter operators for a field' })
    @ApiQuery({ name: 'field', description: 'Field name', example: 'status' })
    @ApiResponse({ status: 200, description: 'Supported operators retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getSupportedOperators(
        @Query('field') field: SearchField,
        @CurrentUser() user: any,
    ): Promise<{ field: string; operators: string[] }> {
        this.logger.log(`Getting supported operators for field: ${field}`);

        const operators = this.filterService.getSupportedOperators(field);

        return {
            field,
            operators,
        };
    }

    @Post('validate')
    @ApiOperation({ summary: 'Validate search query' })
    @ApiResponse({ status: 200, description: 'Query validation result' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async validateQuery(
        @Body(ValidationPipe) searchQuery: SearchQueryDto,
        @CurrentUser() user: any,
    ): Promise<{ isValid: boolean; errors: string[] }> {
        this.logger.log(`Validating search query for user ${user.sub}`);

        return this.queryBuilder.validateQuery(searchQuery);
    }

    @Get('recent')
    @ApiOperation({ summary: 'Get recent searches' })
    @ApiQuery({ name: 'limit', description: 'Number of recent searches', required: false, example: 10 })
    @ApiResponse({ status: 200, description: 'Recent searches retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getRecentSearches(
        @CurrentUser() user: any,
        @Query('limit') limit?: number,
    ): Promise<any[]> {
        this.logger.log(`Getting recent searches for user ${user.sub}`);

        // Mock implementation - in real implementation, this would query search history
        return [
            { query: 'order #12345', timestamp: new Date(), resultCount: 1 },
            { query: 'pending orders', timestamp: new Date(), resultCount: 15 },
            { query: 'customer john', timestamp: new Date(), resultCount: 3 },
        ].slice(0, limit || 10);
    }

    @Get('popular')
    @ApiOperation({ summary: 'Get popular searches' })
    @ApiQuery({ name: 'limit', description: 'Number of popular searches', required: false, example: 10 })
    @ApiResponse({ status: 200, description: 'Popular searches retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getPopularSearches(
        @CurrentUser() user: any,
        @Query('limit') limit?: number,
    ): Promise<any[]> {
        this.logger.log(`Getting popular searches`);

        // Mock implementation - in real implementation, this would query search analytics
        return [
            { query: 'pending orders', count: 150 },
            { query: 'recent orders', count: 120 },
            { query: 'cancelled orders', count: 80 },
            { query: 'delivered orders', count: 200 },
        ].slice(0, limit || 10);
    }

    @Post('reindex/:orderId')
    @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
    @ApiOperation({ summary: 'Reindex a specific order' })
    @ApiResponse({ status: 200, description: 'Order reindexed successfully' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async reindexOrder(
        @Query('orderId') orderId: string,
        @CurrentUser() user: any,
    ): Promise<{ success: boolean; message: string }> {
        this.logger.log(`Reindexing order ${orderId} for user ${user.sub}`);

        try {
            await this.searchService.reindexOrder(orderId);
            return {
                success: true,
                message: `Order ${orderId} reindexed successfully`,
            };
        } catch (error) {
            this.logger.error(`Failed to reindex order ${orderId}: ${error.message}`);
            return {
                success: false,
                message: `Failed to reindex order: ${error.message}`,
            };
        }
    }

    @Post('reindex/all')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Reindex all orders' })
    @ApiResponse({ status: 200, description: 'All orders reindexed successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async reindexAllOrders(@CurrentUser() user: any): Promise<{ success: boolean; message: string }> {
        this.logger.log(`Reindexing all orders for user ${user.sub}`);

        try {
            // In a real implementation, this would reindex all orders
            await this.searchIndexing.reindexAllOrders();
            return {
                success: true,
                message: 'All orders reindexed successfully',
            };
        } catch (error) {
            this.logger.error(`Failed to reindex all orders: ${error.message}`);
            return {
                success: false,
                message: `Failed to reindex all orders: ${error.message}`,
            };
        }
    }

    @Get('fields')
    @ApiOperation({ summary: 'Get available search fields' })
    @ApiResponse({ status: 200, description: 'Search fields retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getSearchFields(@CurrentUser() user: any): Promise<{ fields: SearchField[] }> {
        this.logger.log(`Getting search fields for user ${user.sub}`);

        return {
            fields: Object.values(SearchField),
        };
    }

    @Get('health')
    @ApiOperation({ summary: 'Check search service health' })
    @ApiResponse({ status: 200, description: 'Search service health status' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getSearchHealth(@CurrentUser() user: any): Promise<{
        status: string;
        indexSize: number;
        lastIndexUpdate: Date;
        performance: {
            averageQueryTime: number;
            cacheHitRate: number;
        };
    }> {
        this.logger.log(`Checking search service health for user ${user.sub}`);

        const stats = await this.searchService.getSearchStats();

        return {
            status: 'healthy',
            indexSize: stats.performance.indexSize,
            lastIndexUpdate: stats.performance.lastIndexUpdate,
            performance: {
                averageQueryTime: stats.averageExecutionTime,
                cacheHitRate: stats.performance.cacheHitRate,
            },
        };
    }
}
