import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SearchFilterDto, SearchField, SearchOperator } from '../dto/search-query.dto';

export interface FilterCondition {
    field: SearchField;
    operator: string;
    value: any;
    logicalOperator: SearchOperator;
}

export interface ComplexFilter {
    conditions: FilterCondition[];
    logicalOperator: SearchOperator;
}

export interface FilterResult {
    whereClause: any;
    orderBy?: any[];
    having?: any;
}

@Injectable()
export class FilterService {
    private readonly logger = new Logger(FilterService.name);

    constructor(private readonly prisma: PrismaService) { }

    buildPrismaWhereClause(filters: SearchFilterDto[]): any {
        if (!filters || filters.length === 0) {
            return {};
        }

        this.logger.log(`Building Prisma where clause for ${filters.length} filters`);

        try {
            const whereConditions = this.buildWhereConditions(filters);
            return this.combineConditions(whereConditions);
        } catch (error) {
            this.logger.error(`Failed to build where clause: ${error.message}`);
            throw new Error(`Invalid filter configuration: ${error.message}`);
        }
    }

    private buildWhereConditions(filters: SearchFilterDto[]): any[] {
        return filters.map(filter => {
            const condition = this.buildSingleCondition(filter);
            return condition;
        });
    }

    private buildSingleCondition(filter: SearchFilterDto): any {
        const { field, operator, value } = filter;

        switch (field) {
            case SearchField.ORDER_NUMBER:
                return this.buildStringCondition('orderNumber', operator, value);

            case SearchField.CUSTOMER_NAME:
                return this.buildJsonCondition('shippingAddress', 'name', operator, value);

            case SearchField.CUSTOMER_EMAIL:
                return this.buildJsonCondition('shippingAddress', 'email', operator, value);

            case SearchField.STATUS:
                return this.buildEnumCondition('status', operator, value);

            case SearchField.PAYMENT_STATUS:
                return this.buildEnumCondition('paymentStatus', operator, value);

            case SearchField.FULFILLMENT_STATUS:
                return this.buildEnumCondition('fulfillmentStatus', operator, value);

            case SearchField.TOTAL_AMOUNT:
                return this.buildNumericCondition('totalAmount', operator, value);

            case SearchField.CREATED_AT:
                return this.buildDateCondition('createdAt', operator, value);

            case SearchField.UPDATED_AT:
                return this.buildDateCondition('updatedAt', operator, value);

            case SearchField.SHIPPING_ADDRESS:
                return this.buildJsonCondition('shippingAddress', null, operator, value);

            case SearchField.BILLING_ADDRESS:
                return this.buildJsonCondition('billingAddress', null, operator, value);

            case SearchField.NOTES:
                return this.buildStringCondition('notes', operator, value);

            default:
                throw new Error(`Unsupported filter field: ${field}`);
        }
    }

    private buildStringCondition(field: string, operator: string, value: any): any {
        switch (operator) {
            case 'equals':
                return { [field]: { equals: value } };
            case 'not_equals':
                return { [field]: { not: { equals: value } } };
            case 'contains':
                return { [field]: { contains: value, mode: 'insensitive' } };
            case 'not_contains':
                return { [field]: { not: { contains: value, mode: 'insensitive' } } };
            case 'starts_with':
                return { [field]: { startsWith: value, mode: 'insensitive' } };
            case 'ends_with':
                return { [field]: { endsWith: value, mode: 'insensitive' } };
            case 'in':
                return { [field]: { in: Array.isArray(value) ? value : [value] } };
            case 'not_in':
                return { [field]: { notIn: Array.isArray(value) ? value : [value] } };
            case 'is_null':
                return { [field]: null };
            case 'is_not_null':
                return { [field]: { not: null } };
            default:
                throw new Error(`Unsupported string operator: ${operator}`);
        }
    }

    private buildNumericCondition(field: string, operator: string, value: any): any {
        const numericValue = Number(value);

        switch (operator) {
            case 'equals':
                return { [field]: { equals: numericValue } };
            case 'not_equals':
                return { [field]: { not: { equals: numericValue } } };
            case 'greater_than':
                return { [field]: { gt: numericValue } };
            case 'less_than':
                return { [field]: { lt: numericValue } };
            case 'greater_than_or_equal':
                return { [field]: { gte: numericValue } };
            case 'less_than_or_equal':
                return { [field]: { lte: numericValue } };
            case 'between':
                const [min, max] = Array.isArray(value) ? value.map(Number) : [numericValue, numericValue];
                return {
                    [field]: {
                        gte: min,
                        lte: max,
                    },
                };
            case 'in':
                const values = Array.isArray(value) ? value.map(Number) : [numericValue];
                return { [field]: { in: values } };
            case 'not_in':
                const notValues = Array.isArray(value) ? value.map(Number) : [numericValue];
                return { [field]: { notIn: notValues } };
            default:
                throw new Error(`Unsupported numeric operator: ${operator}`);
        }
    }

    private buildDateCondition(field: string, operator: string, value: any): any {
        const dateValue = new Date(value);

        switch (operator) {
            case 'equals':
                const startOfDay = new Date(dateValue);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(dateValue);
                endOfDay.setHours(23, 59, 59, 999);
                return {
                    [field]: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                };
            case 'not_equals':
                const notStartOfDay = new Date(dateValue);
                notStartOfDay.setHours(0, 0, 0, 0);
                const notEndOfDay = new Date(dateValue);
                notEndOfDay.setHours(23, 59, 59, 999);
                return {
                    [field]: {
                        not: {
                            gte: notStartOfDay,
                            lte: notEndOfDay,
                        },
                    },
                };
            case 'greater_than':
                return { [field]: { gt: dateValue } };
            case 'less_than':
                return { [field]: { lt: dateValue } };
            case 'greater_than_or_equal':
                return { [field]: { gte: dateValue } };
            case 'less_than_or_equal':
                return { [field]: { lte: dateValue } };
            case 'between':
                const [startDate, endDate] = Array.isArray(value)
                    ? value.map(d => new Date(d))
                    : [dateValue, dateValue];
                return {
                    [field]: {
                        gte: startDate,
                        lte: endDate,
                    },
                };
            case 'in':
                const dates = Array.isArray(value) ? value.map(d => new Date(d)) : [dateValue];
                return { [field]: { in: dates } };
            case 'not_in':
                const notDates = Array.isArray(value) ? value.map(d => new Date(d)) : [dateValue];
                return { [field]: { notIn: notDates } };
            default:
                throw new Error(`Unsupported date operator: ${operator}`);
        }
    }

    private buildEnumCondition(field: string, operator: string, value: any): any {
        switch (operator) {
            case 'equals':
                return { [field]: { equals: value } };
            case 'not_equals':
                return { [field]: { not: { equals: value } } };
            case 'in':
                return { [field]: { in: Array.isArray(value) ? value : [value] } };
            case 'not_in':
                return { [field]: { notIn: Array.isArray(value) ? value : [value] } };
            default:
                throw new Error(`Unsupported enum operator: ${operator}`);
        }
    }

    private buildJsonCondition(field: string, jsonPath: string | null, operator: string, value: any): any {
        if (jsonPath) {
            // Search within a specific JSON field
            switch (operator) {
                case 'equals':
                    return { [field]: { path: [jsonPath], equals: value } };
                case 'not_equals':
                    return { [field]: { path: [jsonPath], not: { equals: value } } };
                case 'contains':
                    return { [field]: { path: [jsonPath], string_contains: value } };
                case 'not_contains':
                    return { [field]: { path: [jsonPath], not: { string_contains: value } } };
                case 'starts_with':
                    return { [field]: { path: [jsonPath], string_starts_with: value } };
                case 'ends_with':
                    return { [field]: { path: [jsonPath], string_ends_with: value } };
                case 'in':
                    return { [field]: { path: [jsonPath], in: Array.isArray(value) ? value : [value] } };
                case 'not_in':
                    return { [field]: { path: [jsonPath], notIn: Array.isArray(value) ? value : [value] } };
                default:
                    throw new Error(`Unsupported JSON operator: ${operator}`);
            }
        } else {
            // Search within the entire JSON object
            switch (operator) {
                case 'contains':
                    return { [field]: { string_contains: value } };
                case 'not_contains':
                    return { [field]: { not: { string_contains: value } } };
                default:
                    throw new Error(`Unsupported JSON search operator: ${operator}`);
            }
        }
    }

    private combineConditions(conditions: any[]): any {
        if (conditions.length === 0) {
            return {};
        }

        if (conditions.length === 1) {
            return conditions[0];
        }

        // For now, combine all conditions with AND
        // In a more sophisticated implementation, you would respect the logical operators
        return {
            AND: conditions,
        };
    }

    buildComplexFilter(complexFilter: ComplexFilter): FilterResult {
        this.logger.log(`Building complex filter with ${complexFilter.conditions.length} conditions`);

        try {
            const whereConditions = complexFilter.conditions.map(condition =>
                this.buildSingleCondition({
                    field: condition.field,
                    operator: condition.operator,
                    value: condition.value,
                    logicalOperator: condition.logicalOperator,
                })
            );

            const whereClause = this.combineConditionsWithLogicalOperator(
                whereConditions,
                complexFilter.logicalOperator
            );

            return {
                whereClause,
            };
        } catch (error) {
            this.logger.error(`Failed to build complex filter: ${error.message}`);
            throw new Error(`Invalid complex filter: ${error.message}`);
        }
    }

    private combineConditionsWithLogicalOperator(conditions: any[], operator: SearchOperator): any {
        if (conditions.length === 0) {
            return {};
        }

        if (conditions.length === 1) {
            return conditions[0];
        }

        switch (operator) {
            case SearchOperator.AND:
                return { AND: conditions };
            case SearchOperator.OR:
                return { OR: conditions };
            case SearchOperator.NOT:
                return { NOT: conditions[0] }; // NOT typically applies to a single condition
            default:
                return { AND: conditions };
        }
    }

    buildDateRangeFilter(field: SearchField, startDate: string, endDate: string): any {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return this.buildSingleCondition({
            field,
            operator: 'between',
            value: [start, end],
            logicalOperator: SearchOperator.AND,
        });
    }

    buildNumericRangeFilter(field: SearchField, min: number, max: number): any {
        return this.buildSingleCondition({
            field,
            operator: 'between',
            value: [min, max],
            logicalOperator: SearchOperator.AND,
        });
    }

    buildTextSearchFilter(fields: SearchField[], searchText: string): any {
        const conditions = fields.map(field => {
            if (field === SearchField.CUSTOMER_NAME) {
                return this.buildJsonCondition('shippingAddress', 'name', 'contains', searchText);
            } else if (field === SearchField.CUSTOMER_EMAIL) {
                return this.buildJsonCondition('shippingAddress', 'email', 'contains', searchText);
            } else if (field === SearchField.SHIPPING_ADDRESS) {
                return this.buildJsonCondition('shippingAddress', null, 'contains', searchText);
            } else if (field === SearchField.BILLING_ADDRESS) {
                return this.buildJsonCondition('billingAddress', null, 'contains', searchText);
            } else {
                return this.buildStringCondition(field, 'contains', searchText);
            }
        });

        return { OR: conditions };
    }

    validateFilter(filter: SearchFilterDto): boolean {
        try {
            // Check if field is valid
            if (!Object.values(SearchField).includes(filter.field)) {
                return false;
            }

            // Check if operator is valid
            const validOperators = [
                'equals', 'not_equals', 'contains', 'not_contains',
                'starts_with', 'ends_with', 'greater_than', 'less_than',
                'greater_than_or_equal', 'less_than_or_equal', 'between',
                'in', 'not_in', 'is_null', 'is_not_null'
            ];

            if (!validOperators.includes(filter.operator)) {
                return false;
            }

            // Check if value is provided for operators that require it
            const valueRequiredOperators = [
                'equals', 'not_equals', 'contains', 'not_contains',
                'starts_with', 'ends_with', 'greater_than', 'less_than',
                'greater_than_or_equal', 'less_than_or_equal', 'between',
                'in', 'not_in'
            ];

            if (valueRequiredOperators.includes(filter.operator) && filter.value === undefined) {
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error(`Filter validation failed: ${error.message}`);
            return false;
        }
    }

    getSupportedOperators(field: SearchField): string[] {
        switch (field) {
            case SearchField.ORDER_NUMBER:
            case SearchField.CUSTOMER_NAME:
            case SearchField.CUSTOMER_EMAIL:
            case SearchField.NOTES:
                return ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'in', 'not_in', 'is_null', 'is_not_null'];

            case SearchField.STATUS:
            case SearchField.PAYMENT_STATUS:
            case SearchField.FULFILLMENT_STATUS:
                return ['equals', 'not_equals', 'in', 'not_in'];

            case SearchField.TOTAL_AMOUNT:
                return ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'between', 'in', 'not_in'];

            case SearchField.CREATED_AT:
            case SearchField.UPDATED_AT:
                return ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'between', 'in', 'not_in'];

            case SearchField.SHIPPING_ADDRESS:
            case SearchField.BILLING_ADDRESS:
                return ['contains', 'not_contains'];

            default:
                return [];
        }
    }
}
