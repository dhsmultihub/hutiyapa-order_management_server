import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
    SearchQueryDto,
    SearchField,
    SortDirection,
    AdvancedSearchDto,
} from '../dto/search-query.dto';
import { FilterService } from './filter.service';

export interface QueryOptions {
    include?: any;
    select?: any;
    where?: any;
    orderBy?: any[];
    take?: number;
    skip?: number;
    distinct?: string[];
}

export interface SearchQuery {
    textSearch?: {
        query: string;
        fields: SearchField[];
        fuzzySearch?: boolean;
        fuzzyThreshold?: number;
    };
    filters?: any;
    sorting?: {
        field: SearchField;
        direction: SortDirection;
    }[];
    pagination?: {
        page: number;
        limit: number;
    };
    dateRange?: {
        field: SearchField;
        start: Date;
        end: Date;
    };
    numericRange?: {
        field: SearchField;
        min: number;
        max: number;
    };
}

@Injectable()
export class QueryBuilderService {
    private readonly logger = new Logger(QueryBuilderService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly filterService: FilterService,
    ) { }

    buildSearchQuery(searchQuery: SearchQueryDto): QueryOptions {
        this.logger.log(`Building search query: ${searchQuery.query || 'filtered search'}`);

        const options: QueryOptions = {
            include: {
                orderItems: true,
                payments: true,
                shipments: true,
            },
        };

        // Build where clause
        const whereClause = this.buildWhereClause(searchQuery);
        if (whereClause && Object.keys(whereClause).length > 0) {
            options.where = whereClause;
        }

        // Build sorting
        const orderBy = this.buildOrderBy(searchQuery.sort);
        if (orderBy && orderBy.length > 0) {
            options.orderBy = orderBy;
        }

        // Build pagination
        const pagination = this.buildPagination(searchQuery.page, searchQuery.limit);
        if (pagination) {
            options.take = pagination.limit;
            options.skip = pagination.skip;
        }

        return options;
    }

    buildAdvancedSearchQuery(advancedSearch: AdvancedSearchDto): QueryOptions {
        this.logger.log(`Building advanced search query: ${advancedSearch.query}`);

        const options: QueryOptions = {
            include: {
                orderItems: true,
                payments: true,
                shipments: true,
            },
        };

        // Build where clause for advanced search
        const whereClause = this.buildAdvancedWhereClause(advancedSearch);
        if (whereClause && Object.keys(whereClause).length > 0) {
            options.where = whereClause;
        }

        // Build sorting
        const orderBy = this.buildOrderBy(advancedSearch.sort);
        if (orderBy && orderBy.length > 0) {
            options.orderBy = orderBy;
        }

        // Build pagination
        const pagination = advancedSearch.pagination || { page: 1, limit: 20 };
        options.take = pagination.limit;
        options.skip = (pagination.page - 1) * pagination.limit;

        return options;
    }

    private buildWhereClause(searchQuery: SearchQueryDto): any {
        const whereConditions: any[] = [];

        // Text search
        if (searchQuery.query) {
            const textSearchCondition = this.buildTextSearchCondition(
                searchQuery.query,
                searchQuery.searchFields || [
                    SearchField.ORDER_NUMBER,
                    SearchField.CUSTOMER_NAME,
                    SearchField.CUSTOMER_EMAIL,
                    SearchField.NOTES,
                ],
                searchQuery.fuzzySearch || false,
                searchQuery.fuzzyThreshold || 0.7,
            );
            if (textSearchCondition) {
                whereConditions.push(textSearchCondition);
            }
        }

        // Filters
        if (searchQuery.filters && searchQuery.filters.length > 0) {
            const filterCondition = this.filterService.buildPrismaWhereClause(searchQuery.filters);
            if (filterCondition && Object.keys(filterCondition).length > 0) {
                whereConditions.push(filterCondition);
            }
        }

        return this.combineWhereConditions(whereConditions);
    }

    private buildAdvancedWhereClause(advancedSearch: AdvancedSearchDto): any {
        const whereConditions: any[] = [];

        // Text search
        if (advancedSearch.query) {
            const textSearchCondition = this.buildTextSearchCondition(
                advancedSearch.query,
                advancedSearch.fields || [
                    SearchField.ORDER_NUMBER,
                    SearchField.CUSTOMER_NAME,
                    SearchField.CUSTOMER_EMAIL,
                    SearchField.NOTES,
                ],
                advancedSearch.options?.fuzzySearch || false,
                advancedSearch.options?.fuzzyThreshold || 0.7,
            );
            if (textSearchCondition) {
                whereConditions.push(textSearchCondition);
            }
        }

        // Filters
        if (advancedSearch.filters && advancedSearch.filters.length > 0) {
            const filterCondition = this.filterService.buildPrismaWhereClause(advancedSearch.filters);
            if (filterCondition && Object.keys(filterCondition).length > 0) {
                whereConditions.push(filterCondition);
            }
        }

        // Date range filter
        if (advancedSearch.dateRange) {
            const dateRangeCondition = this.filterService.buildDateRangeFilter(
                advancedSearch.dateRange.field,
                advancedSearch.dateRange.start,
                advancedSearch.dateRange.end,
            );
            if (dateRangeCondition) {
                whereConditions.push(dateRangeCondition);
            }
        }

        // Numeric range filter
        if (advancedSearch.numericRange) {
            const numericRangeCondition = this.filterService.buildNumericRangeFilter(
                advancedSearch.numericRange.field,
                advancedSearch.numericRange.min,
                advancedSearch.numericRange.max,
            );
            if (numericRangeCondition) {
                whereConditions.push(numericRangeCondition);
            }
        }

        return this.combineWhereConditions(whereConditions);
    }

    private buildTextSearchCondition(
        query: string,
        fields: SearchField[],
        fuzzySearch: boolean,
        fuzzyThreshold: number,
    ): any {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

        if (searchTerms.length === 0) {
            return null;
        }

        const fieldConditions: any[] = [];

        for (const field of fields) {
            const fieldCondition = this.buildFieldTextSearch(field, searchTerms, fuzzySearch, fuzzyThreshold);
            if (fieldCondition) {
                fieldConditions.push(fieldCondition);
            }
        }

        return fieldConditions.length > 0 ? { OR: fieldConditions } : null;
    }

    private buildFieldTextSearch(
        field: SearchField,
        searchTerms: string[],
        fuzzySearch: boolean,
        fuzzyThreshold: number,
    ): any {
        const termConditions: any[] = [];

        for (const term of searchTerms) {
            let termCondition: any;

            switch (field) {
                case SearchField.ORDER_NUMBER:
                    termCondition = {
                        orderNumber: {
                            contains: term,
                            mode: 'insensitive',
                        },
                    };
                    break;

                case SearchField.CUSTOMER_NAME:
                    termCondition = {
                        shippingAddress: {
                            path: ['name'],
                            string_contains: term,
                        },
                    };
                    break;

                case SearchField.CUSTOMER_EMAIL:
                    termCondition = {
                        shippingAddress: {
                            path: ['email'],
                            string_contains: term,
                        },
                    };
                    break;

                case SearchField.NOTES:
                    termCondition = {
                        notes: {
                            contains: term,
                            mode: 'insensitive',
                        },
                    };
                    break;

                case SearchField.SHIPPING_ADDRESS:
                    termCondition = {
                        shippingAddress: {
                            string_contains: term,
                        },
                    };
                    break;

                case SearchField.BILLING_ADDRESS:
                    termCondition = {
                        billingAddress: {
                            string_contains: term,
                        },
                    };
                    break;

                default:
                    continue;
            }

            if (termCondition) {
                termConditions.push(termCondition);
            }
        }

        return termConditions.length > 0 ? { OR: termConditions } : null;
    }

    private buildOrderBy(sortOptions?: any[]): any[] {
        if (!sortOptions || sortOptions.length === 0) {
            return [{ createdAt: 'desc' }];
        }

        return sortOptions.map(sort => {
            const direction = sort.direction === SortDirection.ASC ? 'asc' : 'desc';

            switch (sort.field) {
                case SearchField.ORDER_NUMBER:
                    return { orderNumber: direction };
                case SearchField.CUSTOMER_NAME:
                    return { shippingAddress: { path: ['name'], direction } };
                case SearchField.CUSTOMER_EMAIL:
                    return { shippingAddress: { path: ['email'], direction } };
                case SearchField.STATUS:
                    return { status: direction };
                case SearchField.PAYMENT_STATUS:
                    return { paymentStatus: direction };
                case SearchField.FULFILLMENT_STATUS:
                    return { fulfillmentStatus: direction };
                case SearchField.TOTAL_AMOUNT:
                    return { totalAmount: direction };
                case SearchField.CREATED_AT:
                    return { createdAt: direction };
                case SearchField.UPDATED_AT:
                    return { updatedAt: direction };
                case SearchField.NOTES:
                    return { notes: direction };
                default:
                    return { createdAt: 'desc' };
            }
        });
    }

    private buildPagination(page?: number, limit?: number): { limit: number; skip: number } | null {
        if (!page || !limit) {
            return null;
        }

        return {
            limit,
            skip: (page - 1) * limit,
        };
    }

    private combineWhereConditions(conditions: any[]): any {
        if (conditions.length === 0) {
            return {};
        }

        if (conditions.length === 1) {
            return conditions[0];
        }

        return { AND: conditions };
    }

    buildAggregationQuery(filters?: any[]): any {
        const whereClause = filters && filters.length > 0
            ? this.filterService.buildPrismaWhereClause(filters)
            : {};

        return {
            where: whereClause,
            _count: {
                id: true,
            },
            _sum: {
                totalAmount: true,
            },
            _avg: {
                totalAmount: true,
            },
            _min: {
                totalAmount: true,
                createdAt: true,
            },
            _max: {
                totalAmount: true,
                createdAt: true,
            },
        };
    }

    buildGroupByQuery(groupBy: SearchField, filters?: any[]): any {
        const whereClause = filters && filters.length > 0
            ? this.filterService.buildPrismaWhereClause(filters)
            : {};

        const groupByField = this.getGroupByField(groupBy);

        return {
            where: whereClause,
            by: [groupByField],
            _count: {
                id: true,
            },
            _sum: {
                totalAmount: true,
            },
        };
    }

    private getGroupByField(field: SearchField): string {
        switch (field) {
            case SearchField.STATUS:
                return 'status';
            case SearchField.PAYMENT_STATUS:
                return 'paymentStatus';
            case SearchField.FULFILLMENT_STATUS:
                return 'fulfillmentStatus';
            case SearchField.CREATED_AT:
                return 'createdAt';
            case SearchField.UPDATED_AT:
                return 'updatedAt';
            default:
                return 'status';
        }
    }

    buildFacetedSearchQuery(facetFields: SearchField[], filters?: any[]): any {
        const whereClause = filters && filters.length > 0
            ? this.filterService.buildPrismaWhereClause(filters)
            : {};

        const facets: any = {};

        for (const field of facetFields) {
            switch (field) {
                case SearchField.STATUS:
                    facets.status = {
                        where: whereClause,
                        by: ['status'],
                        _count: { id: true },
                    };
                    break;
                case SearchField.PAYMENT_STATUS:
                    facets.paymentStatus = {
                        where: whereClause,
                        by: ['paymentStatus'],
                        _count: { id: true },
                    };
                    break;
                case SearchField.FULFILLMENT_STATUS:
                    facets.fulfillmentStatus = {
                        where: whereClause,
                        by: ['fulfillmentStatus'],
                        _count: { id: true },
                    };
                    break;
            }
        }

        return facets;
    }

    buildSearchSuggestionsQuery(query: string, limit: number = 10): any {
        const searchTerm = query.toLowerCase();

        return {
            where: {
                OR: [
                    {
                        orderNumber: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                    {
                        shippingAddress: {
                            path: ['name'],
                            string_contains: searchTerm,
                        },
                    },
                    {
                        shippingAddress: {
                            path: ['email'],
                            string_contains: searchTerm,
                        },
                    },
                ],
            },
            select: {
                orderNumber: true,
                shippingAddress: true,
            },
            take: limit,
            distinct: ['orderNumber'],
        };
    }

    buildRecentSearchesQuery(userId: string, limit: number = 10): any {
        // This would typically query a search history table
        // For now, return a mock structure
        return {
            where: {
                userId: BigInt(userId),
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        };
    }

    buildPopularSearchesQuery(limit: number = 10): any {
        // This would typically query a search analytics table
        // For now, return a mock structure
        return {
            orderBy: {
                searchCount: 'desc',
            },
            take: limit,
        };
    }

    validateQuery(query: SearchQueryDto): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate pagination
        if (query.page && query.page < 1) {
            errors.push('Page number must be greater than 0');
        }

        if (query.limit && (query.limit < 1 || query.limit > 100)) {
            errors.push('Limit must be between 1 and 100');
        }

        // Validate fuzzy threshold
        if (query.fuzzyThreshold && (query.fuzzyThreshold < 0 || query.fuzzyThreshold > 1)) {
            errors.push('Fuzzy threshold must be between 0 and 1');
        }

        // Validate filters
        if (query.filters) {
            for (const filter of query.filters) {
                if (!this.filterService.validateFilter(filter)) {
                    errors.push(`Invalid filter: ${JSON.stringify(filter)}`);
                }
            }
        }

        // Validate sort fields
        if (query.sort) {
            for (const sort of query.sort) {
                if (!Object.values(SearchField).includes(sort.field)) {
                    errors.push(`Invalid sort field: ${sort.field}`);
                }
                if (!Object.values(SortDirection).includes(sort.direction)) {
                    errors.push(`Invalid sort direction: ${sort.direction}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
