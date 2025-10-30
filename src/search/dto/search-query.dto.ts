import { IsString, IsOptional, IsArray, IsEnum, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SearchOperator {
    AND = 'AND',
    OR = 'OR',
    NOT = 'NOT',
}

export enum SortDirection {
    ASC = 'ASC',
    DESC = 'DESC',
}

export enum SearchField {
    ORDER_NUMBER = 'orderNumber',
    CUSTOMER_NAME = 'customerName',
    CUSTOMER_EMAIL = 'customerEmail',
    STATUS = 'status',
    PAYMENT_STATUS = 'paymentStatus',
    FULFILLMENT_STATUS = 'fulfillmentStatus',
    TOTAL_AMOUNT = 'totalAmount',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    SHIPPING_ADDRESS = 'shippingAddress',
    BILLING_ADDRESS = 'billingAddress',
    NOTES = 'notes',
}

export class SearchFilterDto {
    @ApiProperty({ enum: SearchField, description: 'Field to filter by' })
    @IsEnum(SearchField)
    field: SearchField;

    @ApiProperty({ description: 'Filter operator', example: 'equals' })
    @IsString()
    operator: string;

    @ApiProperty({ description: 'Filter value', example: 'PENDING' })
    value: any;

    @ApiPropertyOptional({ enum: SearchOperator, description: 'Logical operator for combining filters' })
    @IsEnum(SearchOperator)
    @IsOptional()
    logicalOperator?: SearchOperator = SearchOperator.AND;
}

export class SearchSortDto {
    @ApiProperty({ enum: SearchField, description: 'Field to sort by' })
    @IsEnum(SearchField)
    field: SearchField;

    @ApiProperty({ enum: SortDirection, description: 'Sort direction' })
    @IsEnum(SortDirection)
    direction: SortDirection;
}

export class SearchQueryDto {
    @ApiPropertyOptional({ description: 'Search query string', example: 'order #12345' })
    @IsString()
    @IsOptional()
    query?: string;

    @ApiPropertyOptional({ description: 'Fields to search in', enum: SearchField, isArray: true })
    @IsArray()
    @IsEnum(SearchField, { each: true })
    @IsOptional()
    searchFields?: SearchField[] = [
        SearchField.ORDER_NUMBER,
        SearchField.CUSTOMER_NAME,
        SearchField.CUSTOMER_EMAIL,
        SearchField.NOTES,
    ];

    @ApiPropertyOptional({ description: 'Search filters', type: [SearchFilterDto] })
    @IsArray()
    @Type(() => SearchFilterDto)
    @IsOptional()
    filters?: SearchFilterDto[];

    @ApiPropertyOptional({ description: 'Sort options', type: [SearchSortDto] })
    @IsArray()
    @Type(() => SearchSortDto)
    @IsOptional()
    sort?: SearchSortDto[] = [{ field: SearchField.CREATED_AT, direction: SortDirection.DESC }];

    @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', example: 20, minimum: 1, maximum: 100 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number = 20;

    @ApiPropertyOptional({ description: 'Include total count in response' })
    @Transform(({ value }) => value === 'true' || value === true)
    @IsOptional()
    includeTotal?: boolean = true;

    @ApiPropertyOptional({ description: 'Highlight search terms in results' })
    @Transform(({ value }) => value === 'true' || value === true)
    @IsOptional()
    highlight?: boolean = false;

    @ApiPropertyOptional({ description: 'Fuzzy search enabled' })
    @Transform(({ value }) => value === 'true' || value === true)
    @IsOptional()
    fuzzySearch?: boolean = false;

    @ApiPropertyOptional({ description: 'Fuzzy search threshold (0-1)', example: 0.7 })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(1)
    @IsOptional()
    fuzzyThreshold?: number = 0.7;
}

export class SearchResultDto {
    @ApiProperty({ description: 'Search results' })
    results: any[];

    @ApiProperty({ description: 'Total number of results' })
    total: number;

    @ApiProperty({ description: 'Current page' })
    page: number;

    @ApiProperty({ description: 'Items per page' })
    limit: number;

    @ApiProperty({ description: 'Total pages' })
    totalPages: number;

    @ApiProperty({ description: 'Search query used' })
    query: SearchQueryDto;

    @ApiProperty({ description: 'Search execution time in milliseconds' })
    executionTime: number;

    @ApiProperty({ description: 'Search suggestions' })
    suggestions?: SearchSuggestionDto[];

    @ApiProperty({ description: 'Faceted search results' })
    facets?: Record<string, any>;
}

export class SearchSuggestionDto {
    @ApiProperty({ description: 'Suggestion text' })
    text: string;

    @ApiProperty({ description: 'Suggestion type' })
    type: string;

    @ApiProperty({ description: 'Suggestion score' })
    score: number;

    @ApiProperty({ description: 'Suggestion context' })
    context?: string;
}

export class SearchFacetDto {
    @ApiProperty({ description: 'Facet field name' })
    field: string;

    @ApiProperty({ description: 'Facet values' })
    values: Array<{
        value: string;
        count: number;
        selected?: boolean;
    }>;

    @ApiProperty({ description: 'Facet type' })
    type: 'terms' | 'range' | 'date' | 'boolean';
}

export class AdvancedSearchDto {
    @ApiProperty({ description: 'Search query string' })
    @IsString()
    query: string;

    @ApiPropertyOptional({ description: 'Search in specific fields', enum: SearchField, isArray: true })
    @IsArray()
    @IsEnum(SearchField, { each: true })
    @IsOptional()
    fields?: SearchField[];

    @ApiPropertyOptional({ description: 'Search filters', type: [SearchFilterDto] })
    @IsArray()
    @Type(() => SearchFilterDto)
    @IsOptional()
    filters?: SearchFilterDto[];

    @ApiPropertyOptional({ description: 'Date range filter' })
    @IsOptional()
    dateRange?: {
        field: SearchField;
        start: string;
        end: string;
    };

    @ApiPropertyOptional({ description: 'Numeric range filter' })
    @IsOptional()
    numericRange?: {
        field: SearchField;
        min: number;
        max: number;
    };

    @ApiPropertyOptional({ description: 'Sort options', type: [SearchSortDto] })
    @IsArray()
    @Type(() => SearchSortDto)
    @IsOptional()
    sort?: SearchSortDto[];

    @ApiPropertyOptional({ description: 'Pagination options' })
    @IsOptional()
    pagination?: {
        page: number;
        limit: number;
    };

    @ApiPropertyOptional({ description: 'Search options' })
    @IsOptional()
    options?: {
        fuzzySearch: boolean;
        fuzzyThreshold: number;
        highlight: boolean;
        includeTotal: boolean;
    };
}

export class SearchStatsDto {
    @ApiProperty({ description: 'Total search queries executed' })
    totalQueries: number;

    @ApiProperty({ description: 'Average query execution time' })
    averageExecutionTime: number;

    @ApiProperty({ description: 'Most searched terms' })
    popularTerms: Array<{
        term: string;
        count: number;
    }>;

    @ApiProperty({ description: 'Search performance metrics' })
    performance: {
        cacheHitRate: number;
        indexSize: number;
        lastIndexUpdate: Date;
    };
}
