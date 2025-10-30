import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderWebSocketGateway } from '../../websocket/websocket.gateway';
import {
  DashboardDto,
  CreateDashboardDto,
  UpdateDashboardDto,
  AddWidgetDto,
  UpdateWidgetDto,
  DashboardQueryDto,
  DashboardWidgetDto,
  RealTimeMetricsDto,
  RealTimeOrderFeedDto,
  DashboardType,
  WidgetType,
} from '../dto/dashboard.dto';

@Injectable()
export class RealTimeDashboardService {
  private readonly logger = new Logger(RealTimeDashboardService.name);
  private dashboards: Map<string, DashboardDto> = new Map();
  private realTimeMetrics: RealTimeMetricsDto = {
    totalOrders: 0,
    ordersToday: 0,
    totalRevenue: 0,
    revenueToday: 0,
    activeOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    lastUpdated: new Date(),
  };
  private orderFeed: RealTimeOrderFeedDto[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketGateway: OrderWebSocketGateway,
  ) {
    this.initializeDefaultDashboards();
    this.startRealTimeUpdates();
  }

  private initializeDefaultDashboards(): void {
    // Executive Dashboard
    const executiveDashboard: DashboardDto = {
      id: 'executive-dashboard',
      name: 'Executive Dashboard',
      type: DashboardType.EXECUTIVE,
      description: 'High-level overview for executives',
      ownerId: 'system',
      isShared: true,
      widgets: [
        {
          id: 'total-revenue',
          type: WidgetType.METRIC_CARD,
          title: 'Total Revenue',
          description: 'Total revenue across all orders',
          layout: { x: 0, y: 0, w: 3, h: 2 },
          config: { color: 'green', icon: 'dollar' },
          data: { value: 0, change: '+12.5%' },
          lastUpdated: new Date(),
          refreshInterval: 60,
        },
        {
          id: 'orders-today',
          type: WidgetType.METRIC_CARD,
          title: 'Orders Today',
          description: 'Number of orders placed today',
          layout: { x: 3, y: 0, w: 3, h: 2 },
          config: { color: 'blue', icon: 'shopping-cart' },
          data: { value: 0, change: '+8.2%' },
          lastUpdated: new Date(),
          refreshInterval: 30,
        },
        {
          id: 'revenue-chart',
          type: WidgetType.LINE_CHART,
          title: 'Revenue Trend',
          description: 'Revenue trend over the last 30 days',
          layout: { x: 0, y: 2, w: 6, h: 4 },
          config: { 
            xAxis: 'date',
            yAxis: 'revenue',
            showLegend: true,
            colors: ['#007bff']
          },
          data: { labels: [], datasets: [] },
          lastUpdated: new Date(),
          refreshInterval: 300,
        },
        {
          id: 'top-products',
          type: WidgetType.TABLE,
          title: 'Top Products',
          description: 'Best selling products',
          layout: { x: 6, y: 0, w: 6, h: 6 },
          config: { 
            columns: ['Product', 'Sales', 'Revenue'],
            sortable: true,
            pagination: true
          },
          data: { rows: [] },
          lastUpdated: new Date(),
          refreshInterval: 600,
        },
      ],
      layout: {
        columns: 12,
        rowHeight: 60,
        margin: [10, 10],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Operations Dashboard
    const operationsDashboard: DashboardDto = {
      id: 'operations-dashboard',
      name: 'Operations Dashboard',
      type: DashboardType.OPERATIONS,
      description: 'Operational metrics and real-time updates',
      ownerId: 'system',
      isShared: true,
      widgets: [
        {
          id: 'active-orders',
          type: WidgetType.METRIC_CARD,
          title: 'Active Orders',
          description: 'Currently processing orders',
          layout: { x: 0, y: 0, w: 3, h: 2 },
          config: { color: 'orange', icon: 'clock' },
          data: { value: 0, change: '+5.1%' },
          lastUpdated: new Date(),
          refreshInterval: 15,
        },
        {
          id: 'pending-orders',
          type: WidgetType.METRIC_CARD,
          title: 'Pending Orders',
          description: 'Orders awaiting processing',
          layout: { x: 3, y: 0, w: 3, h: 2 },
          config: { color: 'yellow', icon: 'hourglass' },
          data: { value: 0, change: '-2.3%' },
          lastUpdated: new Date(),
          refreshInterval: 15,
        },
        {
          id: 'order-feed',
          type: WidgetType.REAL_TIME_FEED,
          title: 'Real-time Order Feed',
          description: 'Live updates of order activities',
          layout: { x: 0, y: 2, w: 6, h: 6 },
          config: { 
            maxItems: 50,
            autoScroll: true,
            showTimestamp: true
          },
          data: { items: [] },
          lastUpdated: new Date(),
          refreshInterval: 5,
        },
        {
          id: 'order-status-chart',
          type: WidgetType.PIE_CHART,
          title: 'Order Status Distribution',
          description: 'Distribution of orders by status',
          layout: { x: 6, y: 0, w: 6, h: 4 },
          config: { 
            showLegend: true,
            showPercentage: true,
            colors: ['#28a745', '#ffc107', '#dc3545', '#17a2b8']
          },
          data: { labels: [], datasets: [] },
          lastUpdated: new Date(),
          refreshInterval: 60,
        },
        {
          id: 'processing-time',
          type: WidgetType.BAR_CHART,
          title: 'Average Processing Time',
          description: 'Average time to process orders by status',
          layout: { x: 6, y: 4, w: 6, h: 4 },
          config: { 
            xAxis: 'status',
            yAxis: 'hours',
            showLegend: false,
            colors: ['#007bff']
          },
          data: { labels: [], datasets: [] },
          lastUpdated: new Date(),
          refreshInterval: 300,
        },
      ],
      layout: {
        columns: 12,
        rowHeight: 60,
        margin: [10, 10],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Customer Dashboard
    const customerDashboard: DashboardDto = {
      id: 'customer-dashboard',
      name: 'Customer Dashboard',
      type: DashboardType.CUSTOMER,
      description: 'Customer-focused metrics and insights',
      ownerId: 'system',
      isShared: true,
      widgets: [
        {
          id: 'customer-satisfaction',
          type: WidgetType.METRIC_CARD,
          title: 'Customer Satisfaction',
          description: 'Average customer satisfaction score',
          layout: { x: 0, y: 0, w: 3, h: 2 },
          config: { color: 'green', icon: 'star' },
          data: { value: 4.5, change: '+0.2' },
          lastUpdated: new Date(),
          refreshInterval: 3600,
        },
        {
          id: 'support-tickets',
          type: WidgetType.METRIC_CARD,
          title: 'Open Support Tickets',
          description: 'Currently open support tickets',
          layout: { x: 3, y: 0, w: 3, h: 2 },
          config: { color: 'red', icon: 'support' },
          data: { value: 0, change: '-15.3%' },
          lastUpdated: new Date(),
          refreshInterval: 60,
        },
        {
          id: 'return-rate',
          type: WidgetType.METRIC_CARD,
          title: 'Return Rate',
          description: 'Percentage of orders returned',
          layout: { x: 6, y: 0, w: 3, h: 2 },
          config: { color: 'orange', icon: 'undo' },
          data: { value: 2.1, change: '-0.5%' },
          lastUpdated: new Date(),
          refreshInterval: 3600,
        },
        {
          id: 'customer-feedback',
          type: WidgetType.LIST,
          title: 'Recent Customer Feedback',
          description: 'Latest customer reviews and feedback',
          layout: { x: 0, y: 2, w: 6, h: 6 },
          config: { 
            maxItems: 20,
            showRating: true,
            showTimestamp: true
          },
          data: { items: [] },
          lastUpdated: new Date(),
          refreshInterval: 300,
        },
        {
          id: 'customer-segments',
          type: WidgetType.PIE_CHART,
          title: 'Customer Segments',
          description: 'Distribution of customers by segment',
          layout: { x: 6, y: 2, w: 6, h: 6 },
          config: { 
            showLegend: true,
            showPercentage: true,
            colors: ['#007bff', '#28a745', '#ffc107', '#dc3545']
          },
          data: { labels: [], datasets: [] },
          lastUpdated: new Date(),
          refreshInterval: 1800,
        },
      ],
      layout: {
        columns: 12,
        rowHeight: 60,
        margin: [10, 10],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(executiveDashboard.id, executiveDashboard);
    this.dashboards.set(operationsDashboard.id, operationsDashboard);
    this.dashboards.set(customerDashboard.id, customerDashboard);
  }

  private startRealTimeUpdates(): void {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateRealTimeMetrics();
    }, 30000);

    // Update order feed every 5 seconds
    setInterval(() => {
      this.updateOrderFeed();
    }, 5000);

    // Broadcast updates via WebSocket
    setInterval(() => {
      this.broadcastDashboardUpdates();
    }, 10000);
  }

  private async updateRealTimeMetrics(): Promise<void> {
    try {
      // Mock data - replace with actual database queries
      this.realTimeMetrics = {
        totalOrders: Math.floor(Math.random() * 1000) + 1000,
        ordersToday: Math.floor(Math.random() * 50) + 20,
        totalRevenue: Math.floor(Math.random() * 100000) + 50000,
        revenueToday: Math.floor(Math.random() * 5000) + 1000,
        activeOrders: Math.floor(Math.random() * 30) + 10,
        pendingOrders: Math.floor(Math.random() * 15) + 5,
        completedOrders: Math.floor(Math.random() * 800) + 700,
        cancelledOrders: Math.floor(Math.random() * 20) + 5,
        averageOrderValue: Math.floor(Math.random() * 50) + 75,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to update real-time metrics: ${error.message}`);
    }
  }

  private async updateOrderFeed(): Promise<void> {
    try {
      // Mock order feed data - replace with actual database queries
      const newFeedItem: RealTimeOrderFeedDto = {
        orderId: Math.floor(Math.random() * 1000).toString(),
        orderNumber: `ORD-2025-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        customerName: `Customer ${Math.floor(Math.random() * 100)}`,
        status: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'][Math.floor(Math.random() * 4)],
        amount: Math.floor(Math.random() * 500) + 50,
        eventType: ['ORDER_CREATED', 'ORDER_UPDATED', 'PAYMENT_RECEIVED', 'SHIPMENT_CREATED'][Math.floor(Math.random() * 4)],
        timestamp: new Date(),
        description: 'Order activity update',
      };

      this.orderFeed.unshift(newFeedItem);
      
      // Keep only last 100 items
      if (this.orderFeed.length > 100) {
        this.orderFeed = this.orderFeed.slice(0, 100);
      }
    } catch (error) {
      this.logger.error(`Failed to update order feed: ${error.message}`);
    }
  }

  private broadcastDashboardUpdates(): void {
    try {
      // Broadcast real-time metrics
      this.websocketGateway.emitBroadcastNotification({
        type: 'DASHBOARD_METRICS_UPDATE',
        data: this.realTimeMetrics,
      }, ['admin', 'employee']);

      // Broadcast order feed updates
      if (this.orderFeed.length > 0) {
        this.websocketGateway.emitBroadcastNotification({
          type: 'ORDER_FEED_UPDATE',
          data: this.orderFeed.slice(0, 10), // Send last 10 items
        }, ['admin', 'employee']);
      }
    } catch (error) {
      this.logger.error(`Failed to broadcast dashboard updates: ${error.message}`);
    }
  }

  // Dashboard CRUD operations
  async createDashboard(createDto: CreateDashboardDto, userId: string): Promise<DashboardDto> {
    this.logger.log(`Creating dashboard: ${createDto.name}`);

    const dashboard: DashboardDto = {
      id: `dashboard-${Date.now()}`,
      name: createDto.name,
      type: createDto.type,
      description: createDto.description,
      ownerId: userId,
      isShared: createDto.isShared || false,
      widgets: [],
      layout: createDto.layout || {
        columns: 12,
        rowHeight: 60,
        margin: [10, 10],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboard.id, dashboard);
    this.logger.log(`Dashboard created with ID: ${dashboard.id}`);

    return dashboard;
  }

  async getDashboards(query: DashboardQueryDto, userId: string): Promise<{ dashboards: DashboardDto[]; total: number }> {
    let filteredDashboards = Array.from(this.dashboards.values());

    // Apply filters
    if (query.type) {
      filteredDashboards = filteredDashboards.filter(d => d.type === query.type);
    }

    if (query.ownerId) {
      filteredDashboards = filteredDashboards.filter(d => d.ownerId === query.ownerId);
    }

    if (query.isShared !== undefined) {
      filteredDashboards = filteredDashboards.filter(d => d.isShared === query.isShared);
    }

    // Filter by user access (owned or shared)
    filteredDashboards = filteredDashboards.filter(d => d.ownerId === userId || d.isShared);

    // Pagination
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedDashboards = filteredDashboards.slice(startIndex, endIndex);

    return {
      dashboards: paginatedDashboards,
      total: filteredDashboards.length,
    };
  }

  async getDashboard(dashboardId: string, userId: string): Promise<DashboardDto> {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    if (dashboard.ownerId !== userId && !dashboard.isShared) {
      throw new Error('Access denied');
    }

    return dashboard;
  }

  async updateDashboard(dashboardId: string, updateDto: UpdateDashboardDto, userId: string): Promise<DashboardDto> {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    if (dashboard.ownerId !== userId) {
      throw new Error('Access denied');
    }

    const updatedDashboard: DashboardDto = {
      ...dashboard,
      ...updateDto,
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboardId, updatedDashboard);
    return updatedDashboard;
  }

  async deleteDashboard(dashboardId: string, userId: string): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    if (dashboard.ownerId !== userId) {
      throw new Error('Access denied');
    }

    this.dashboards.delete(dashboardId);
  }

  // Widget operations
  async addWidget(dashboardId: string, addWidgetDto: AddWidgetDto, userId: string): Promise<DashboardWidgetDto> {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    if (dashboard.ownerId !== userId) {
      throw new Error('Access denied');
    }

    const widget: DashboardWidgetDto = {
      id: `widget-${Date.now()}`,
      type: addWidgetDto.type,
      title: addWidgetDto.title,
      description: addWidgetDto.description,
      layout: addWidgetDto.layout,
      config: addWidgetDto.config || {},
      data: this.getDefaultWidgetData(addWidgetDto.type),
      lastUpdated: new Date(),
      refreshInterval: addWidgetDto.refreshInterval || 60,
    };

    dashboard.widgets.push(widget);
    dashboard.updatedAt = new Date();

    this.dashboards.set(dashboardId, dashboard);
    return widget;
  }

  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updateWidgetDto: UpdateWidgetDto,
    userId: string,
  ): Promise<DashboardWidgetDto> {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    if (dashboard.ownerId !== userId) {
      throw new Error('Access denied');
    }

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      throw new Error('Widget not found');
    }

    const updatedWidget: DashboardWidgetDto = {
      ...dashboard.widgets[widgetIndex],
      ...updateWidgetDto,
      lastUpdated: new Date(),
    };

    dashboard.widgets[widgetIndex] = updatedWidget;
    dashboard.updatedAt = new Date();

    this.dashboards.set(dashboardId, dashboard);
    return updatedWidget;
  }

  async deleteWidget(dashboardId: string, widgetId: string, userId: string): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    if (dashboard.ownerId !== userId) {
      throw new Error('Access denied');
    }

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      throw new Error('Widget not found');
    }

    dashboard.widgets.splice(widgetIndex, 1);
    dashboard.updatedAt = new Date();

    this.dashboards.set(dashboardId, dashboard);
  }

  // Real-time data methods
  async getRealTimeMetrics(): Promise<RealTimeMetricsDto> {
    return this.realTimeMetrics;
  }

  async getOrderFeed(limit: number = 50): Promise<RealTimeOrderFeedDto[]> {
    return this.orderFeed.slice(0, limit);
  }

  async getWidgetData(dashboardId: string, widgetId: string, userId: string): Promise<any> {
    const dashboard = await this.getDashboard(dashboardId, userId);
    const widget = dashboard.widgets.find(w => w.id === widgetId);
    
    if (!widget) {
      throw new Error('Widget not found');
    }

    // Return updated data based on widget type
    return this.getUpdatedWidgetData(widget);
  }

  private getDefaultWidgetData(type: WidgetType): any {
    switch (type) {
      case WidgetType.METRIC_CARD:
        return { value: 0, change: '+0%' };
      case WidgetType.CHART:
      case WidgetType.LINE_CHART:
      case WidgetType.BAR_CHART:
        return { labels: [], datasets: [] };
      case WidgetType.PIE_CHART:
        return { labels: [], datasets: [] };
      case WidgetType.TABLE:
        return { columns: [], rows: [] };
      case WidgetType.LIST:
        return { items: [] };
      case WidgetType.REAL_TIME_FEED:
        return { items: [] };
      case WidgetType.PROGRESS_BAR:
        return { value: 0, max: 100 };
      case WidgetType.ALERT:
        return { message: '', type: 'info' };
      default:
        return {};
    }
  }

  private getUpdatedWidgetData(widget: DashboardWidgetDto): any {
    // Return real-time data based on widget type and configuration
    switch (widget.type) {
      case WidgetType.METRIC_CARD:
        return {
          value: this.realTimeMetrics.totalOrders,
          change: '+12.5%',
        };
      case WidgetType.REAL_TIME_FEED:
        return {
          items: this.orderFeed.slice(0, 20),
        };
      default:
        return widget.data;
    }
  }
}
