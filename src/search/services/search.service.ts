import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
    SearchQueryDto,
    SearchResultDto,
    SearchSuggestionDto,
    SearchFacetDto,
    AdvancedSearchDto,
    SearchStatsDto,
    SearchField,
    SearchOperator,
} from '../dto/search-query.dto';

interface SearchIndex {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    shippingAddress: any;
    billingAddress: any;
    notes: string;
    searchableText: string;
}

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);
    private searchIndex: Map<string, SearchIndex> = new Map();
    private searchStats = {
        totalQueries: 0,
        totalExecutionTime: 0,
        popularTerms: new Map<string, number>(),
    };

    constructor(private readonly prisma: PrismaService) {
        this.initializeSearchIndex();
    }

    private async initializeSearchIndex(): Promise<void> {
        this.logger.log('Initializing search index...');

        try {
            // Load all orders into search index
            const orders = await this.prisma.order.findMany({
                include: {
                    orderItems: true,
                },
            });

            for (const order of orders) {
                this.addToSearchIndex(order);
            }

            this.logger.log(`Search index initialized with ${this.searchIndex.size} orders`);
        } catch (error) {
            this.logger.error(`Failed to initialize search index: ${error.message}`);
        }
    }

    private addToSearchIndex(order: any): void {
        const searchableText = this.buildSearchableText(order);

        const searchDoc: SearchIndex = {
            id: order.id.toString(),
            orderNumber: order.orderNumber,
            customerName: this.extractCustomerName(order),
            customerEmail: this.extractCustomerEmail(order),
            status: order.status,
            paymentStatus: order.paymentStatus,
            fulfillmentStatus: order.fulfillmentStatus,
            totalAmount: order.totalAmount.toNumber(),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress,
            notes: order.notes || '',
            searchableText,
        };

        this.searchIndex.set(order.id.toString(), searchDoc);
    }

    private buildSearchableText(order: any): string {
        const parts = [
            order.orderNumber,
            this.extractCustomerName(order),
            this.extractCustomerEmail(order),
            order.status,
            order.paymentStatus,
            order.fulfillmentStatus,
            order.notes || '',
            this.extractAddressText(order.shippingAddress),
            this.extractAddressText(order.billingAddress),
        ];

        return parts.filter(Boolean).join(' ').toLowerCase();
    }

    private extractCustomerName(order: any): string {
        if (order.shippingAddress && typeof order.shippingAddress === 'object') {
            return order.shippingAddress.name || order.shippingAddress.fullName || '';
        }
        return '';
    }

    private extractCustomerEmail(order: any): string {
        if (order.shippingAddress && typeof order.shippingAddress === 'object') {
            return order.shippingAddress.email || '';
        }
        return '';
    }

    private extractAddressText(address: any): string {
        if (!address || typeof address !== 'object') return '';

        const addressParts = [
            address.street,
            address.city,
            address.state,
            address.country,
            address.postalCode,
        ];

        return addressParts.filter(Boolean).join(' ').toLowerCase();
    }

    async search(query: SearchQueryDto): Promise<SearchResultDto> {
        const startTime = Date.now();
        this.searchStats.totalQueries++;

        this.logger.log(`Executing search query: ${query.query || 'filtered search'}`);

        try {
            let results = Array.from(this.searchIndex.values());

            // Apply text search
            if (query.query) {
                results = this.performTextSearch(results, query);
            }

            // Apply filters
            if (query.filters && query.filters.length > 0) {
                results = this.applyFilters(results, query.filters);
            }

            // Apply sorting
            if (query.sort && query.sort.length > 0) {
                results = this.applySorting(results, query.sort);
            }

            // Get total count before pagination
            const total = results.length;

            // Apply pagination
            const page = query.page || 1;
            const limit = query.limit || 20;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = results.slice(startIndex, endIndex);

            // Highlight search terms if requested
            if (query.highlight && query.query) {
                this.highlightSearchTerms(paginatedResults, query.query);
            }

            const executionTime = Date.now() - startTime;
            this.searchStats.totalExecutionTime += executionTime;

            // Update popular terms
            if (query.query) {
                const terms = query.query.toLowerCase().split(/\s+/);
                terms.forEach(term => {
                    if (term.length > 2) {
                        this.searchStats.popularTerms.set(term, (this.searchStats.popularTerms.get(term) || 0) + 1);
                    }
                });
            }

            const result: SearchResultDto = {
                results: paginatedResults,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                query,
                executionTime,
                suggestions: query.query ? this.generateSuggestions(query.query) : [],
                facets: this.generateFacets(results, query),
            };

            this.logger.log(`Search completed in ${executionTime}ms, found ${total} results`);
            return result;
        } catch (error) {
            this.logger.error(`Search failed: ${error.message}`);
            throw error;
        }
    }

    private performTextSearch(results: SearchIndex[], query: SearchQueryDto): SearchIndex[] {
        if (!query.query) return results;

        const searchTerms = query.query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        const searchFields = query.searchFields || [
            SearchField.ORDER_NUMBER,
            SearchField.CUSTOMER_NAME,
            SearchField.CUSTOMER_EMAIL,
            SearchField.NOTES,
        ];

        return results.filter(doc => {
            let score = 0;

            for (const term of searchTerms) {
                for (const field of searchFields) {
                    const fieldValue = this.getFieldValue(doc, field).toLowerCase();

                    if (query.fuzzySearch) {
                        if (this.fuzzyMatch(fieldValue, term, query.fuzzyThreshold || 0.7)) {
                            score += 1;
                        }
                    } else {
                        if (fieldValue.includes(term)) {
                            score += 1;
                        }
                    }
                }
            }

            return score > 0;
        }).sort((a, b) => {
            // Simple scoring based on term matches
            const scoreA = this.calculateRelevanceScore(a, searchTerms, searchFields);
            const scoreB = this.calculateRelevanceScore(b, searchTerms, searchFields);
            return scoreB - scoreA;
        });
    }

    private calculateRelevanceScore(doc: SearchIndex, terms: string[], fields: SearchField[]): number {
        let score = 0;

        for (const term of terms) {
            for (const field of fields) {
                const fieldValue = this.getFieldValue(doc, field).toLowerCase();

                // Exact match gets highest score
                if (fieldValue === term) {
                    score += 10;
                }
                // Starts with gets high score
                else if (fieldValue.startsWith(term)) {
                    score += 5;
                }
                // Contains gets medium score
                else if (fieldValue.includes(term)) {
                    score += 2;
                }
            }
        }

        return score;
    }

    private fuzzyMatch(text: string, pattern: string, threshold: number): boolean {
        const distance = this.levenshteinDistance(text, pattern);
        const maxLength = Math.max(text.length, pattern.length);
        const similarity = 1 - (distance / maxLength);
        return similarity >= threshold;
    }

    private levenshteinDistance(str1: string, str2: string): number {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }

        return matrix[str2.length][str1.length];
    }

    private applyFilters(results: SearchIndex[], filters: any[]): SearchIndex[] {
        return results.filter(doc => {
            return filters.every(filter => this.evaluateFilter(doc, filter));
        });
    }

    private evaluateFilter(doc: SearchIndex, filter: any): boolean {
        const fieldValue = this.getFieldValue(doc, filter.field);
        const filterValue = filter.value;

        switch (filter.operator) {
            case 'equals':
                return fieldValue === filterValue;
            case 'not_equals':
                return fieldValue !== filterValue;
            case 'contains':
                return fieldValue.toLowerCase().includes(filterValue.toLowerCase());
            case 'not_contains':
                return !fieldValue.toLowerCase().includes(filterValue.toLowerCase());
            case 'starts_with':
                return fieldValue.toLowerCase().startsWith(filterValue.toLowerCase());
            case 'ends_with':
                return fieldValue.toLowerCase().endsWith(filterValue.toLowerCase());
            case 'greater_than':
                return Number(fieldValue) > Number(filterValue);
            case 'less_than':
                return Number(fieldValue) < Number(filterValue);
            case 'greater_than_or_equal':
                return Number(fieldValue) >= Number(filterValue);
            case 'less_than_or_equal':
                return Number(fieldValue) <= Number(filterValue);
            case 'in':
                return Array.isArray(filterValue) && filterValue.includes(fieldValue);
            case 'not_in':
                return Array.isArray(filterValue) && !filterValue.includes(fieldValue);
            case 'between':
                const [min, max] = Array.isArray(filterValue) ? filterValue : [filterValue, filterValue];
                return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);
            case 'is_null':
                return fieldValue === null || fieldValue === undefined || fieldValue === '';
            case 'is_not_null':
                return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
            default:
                return true;
        }
    }

    private applySorting(results: SearchIndex[], sortOptions: any[]): SearchIndex[] {
        return results.sort((a, b) => {
            for (const sort of sortOptions) {
                const aValue = this.getFieldValue(a, sort.field);
                const bValue = this.getFieldValue(b, sort.field);

                let comparison = 0;

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    comparison = aValue.localeCompare(bValue);
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue - bValue;
                } else if (aValue instanceof Date && bValue instanceof Date) {
                    comparison = aValue.getTime() - bValue.getTime();
                }

                if (comparison !== 0) {
                    return sort.direction === 'DESC' ? -comparison : comparison;
                }
            }
            return 0;
        });
    }

    private getFieldValue(doc: SearchIndex, field: SearchField): any {
        switch (field) {
            case SearchField.ORDER_NUMBER:
                return doc.orderNumber;
            case SearchField.CUSTOMER_NAME:
                return doc.customerName;
            case SearchField.CUSTOMER_EMAIL:
                return doc.customerEmail;
            case SearchField.STATUS:
                return doc.status;
            case SearchField.PAYMENT_STATUS:
                return doc.paymentStatus;
            case SearchField.FULFILLMENT_STATUS:
                return doc.fulfillmentStatus;
            case SearchField.TOTAL_AMOUNT:
                return doc.totalAmount;
            case SearchField.CREATED_AT:
                return doc.createdAt;
            case SearchField.UPDATED_AT:
                return doc.updatedAt;
            case SearchField.SHIPPING_ADDRESS:
                return JSON.stringify(doc.shippingAddress);
            case SearchField.BILLING_ADDRESS:
                return JSON.stringify(doc.billingAddress);
            case SearchField.NOTES:
                return doc.notes;
            default:
                return '';
        }
    }

    private highlightSearchTerms(results: SearchIndex[], query: string): void {
        const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

        results.forEach(doc => {
            // Add highlighting metadata to results
            (doc as any).highlighted = {};

            terms.forEach(term => {
                if (doc.orderNumber.toLowerCase().includes(term)) {
                    (doc as any).highlighted.orderNumber = this.highlightText(doc.orderNumber, term);
                }
                if (doc.customerName.toLowerCase().includes(term)) {
                    (doc as any).highlighted.customerName = this.highlightText(doc.customerName, term);
                }
                if (doc.notes.toLowerCase().includes(term)) {
                    (doc as any).highlighted.notes = this.highlightText(doc.notes, term);
                }
            });
        });
    }

    private highlightText(text: string, term: string): string {
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    private generateSuggestions(query: string): SearchSuggestionDto[] {
        const suggestions: SearchSuggestionDto[] = [];
        const queryLower = query.toLowerCase();

        // Generate suggestions based on popular terms
        for (const [term, count] of this.searchStats.popularTerms.entries()) {
            if (term.includes(queryLower) && term !== queryLower) {
                suggestions.push({
                    text: term,
                    type: 'popular_term',
                    score: count,
                });
            }
        }

        // Generate suggestions based on order numbers
        for (const doc of this.searchIndex.values()) {
            if (doc.orderNumber.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    text: doc.orderNumber,
                    type: 'order_number',
                    score: 1,
                });
            }
        }

        // Sort by score and return top 5
        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    private generateFacets(results: SearchIndex[], query: SearchQueryDto): Record<string, any> {
        const facets: Record<string, any> = {};

        // Status facet
        const statusCounts = new Map<string, number>();
        results.forEach(doc => {
            statusCounts.set(doc.status, (statusCounts.get(doc.status) || 0) + 1);
        });
        facets.status = Array.from(statusCounts.entries()).map(([value, count]) => ({ value, count }));

        // Payment status facet
        const paymentStatusCounts = new Map<string, number>();
        results.forEach(doc => {
            paymentStatusCounts.set(doc.paymentStatus, (paymentStatusCounts.get(doc.paymentStatus) || 0) + 1);
        });
        facets.paymentStatus = Array.from(paymentStatusCounts.entries()).map(([value, count]) => ({ value, count }));

        // Date range facet
        const dates = results.map(doc => doc.createdAt).sort();
        if (dates.length > 0) {
            facets.dateRange = {
                min: dates[0],
                max: dates[dates.length - 1],
            };
        }

        return facets;
    }

    async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestionDto[]> {
        return this.generateSuggestions(query).slice(0, limit);
    }

    async getSearchStats(): Promise<SearchStatsDto> {
        const averageExecutionTime = this.searchStats.totalQueries > 0
            ? this.searchStats.totalExecutionTime / this.searchStats.totalQueries
            : 0;

        const popularTerms = Array.from(this.searchStats.popularTerms.entries())
            .map(([term, count]) => ({ term, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalQueries: this.searchStats.totalQueries,
            averageExecutionTime,
            popularTerms,
            performance: {
                cacheHitRate: 0.85, // Mock value
                indexSize: this.searchIndex.size,
                lastIndexUpdate: new Date(),
            },
        };
    }

    async reindexOrder(orderId: string): Promise<void> {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: BigInt(orderId) },
                include: { orderItems: true },
            });

            if (order) {
                this.addToSearchIndex(order);
                this.logger.log(`Reindexed order ${orderId}`);
            }
        } catch (error) {
            this.logger.error(`Failed to reindex order ${orderId}: ${error.message}`);
        }
    }

    async removeFromIndex(orderId: string): Promise<void> {
        this.searchIndex.delete(orderId);
        this.logger.log(`Removed order ${orderId} from search index`);
    }
}
