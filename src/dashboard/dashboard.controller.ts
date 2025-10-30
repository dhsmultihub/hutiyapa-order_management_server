import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
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
import { RealTimeDashboardService } from './services/real-time-dashboard.service';
import {
  DashboardDto,
  CreateDashboardDto,
  UpdateDashboardDto,
  AddWidgetDto,
  UpdateWidgetDto,
  DashboardQueryDto,
  RealTimeMetricsDto,
  RealTimeOrderFeedDto,
} from './dto/dashboard.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: RealTimeDashboardService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new dashboard' })
  @ApiResponse({ status: 201, description: 'Dashboard created successfully', type: DashboardDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createDashboard(
    @Body() createDashboardDto: CreateDashboardDto,
    @CurrentUser() user: any,
  ): Promise<DashboardDto> {
    return this.dashboardService.createDashboard(createDashboardDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get dashboards' })
  @ApiResponse({ status: 200, description: 'Dashboards retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboards(
    @Query() query: DashboardQueryDto,
    @CurrentUser() user: any,
  ): Promise<{ dashboards: DashboardDto[]; total: number }> {
    return this.dashboardService.getDashboards(query, user.sub);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Dashboard ID', example: 'dashboard-1' })
  @ApiOperation({ summary: 'Get dashboard by ID' })
  @ApiResponse({ status: 200, description: 'Dashboard retrieved successfully', type: DashboardDto })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<DashboardDto> {
    return this.dashboardService.getDashboard(id, user.sub);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiParam({ name: 'id', description: 'Dashboard ID', example: 'dashboard-1' })
  @ApiOperation({ summary: 'Update dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard updated successfully', type: DashboardDto })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateDashboard(
    @Param('id') id: string,
    @Body() updateDashboardDto: UpdateDashboardDto,
    @CurrentUser() user: any,
  ): Promise<DashboardDto> {
    return this.dashboardService.updateDashboard(id, updateDashboardDto, user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiParam({ name: 'id', description: 'Dashboard ID', example: 'dashboard-1' })
  @ApiOperation({ summary: 'Delete dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard deleted successfully' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteDashboard(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.dashboardService.deleteDashboard(id, user.sub);
  }

  @Post(':id/widgets')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiParam({ name: 'id', description: 'Dashboard ID', example: 'dashboard-1' })
  @ApiOperation({ summary: 'Add widget to dashboard' })
  @ApiResponse({ status: 201, description: 'Widget added successfully' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async addWidget(
    @Param('id') dashboardId: string,
    @Body() addWidgetDto: AddWidgetDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.dashboardService.addWidget(dashboardId, addWidgetDto, user.sub);
  }

  @Put(':id/widgets/:widgetId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiParam({ name: 'id', description: 'Dashboard ID', example: 'dashboard-1' })
  @ApiParam({ name: 'widgetId', description: 'Widget ID', example: 'widget-1' })
  @ApiOperation({ summary: 'Update widget' })
  @ApiResponse({ status: 200, description: 'Widget updated successfully' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateWidget(
    @Param('id') dashboardId: string,
    @Param('widgetId') widgetId: string,
    @Body() updateWidgetDto: UpdateWidgetDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.dashboardService.updateWidget(dashboardId, widgetId, updateWidgetDto, user.sub);
  }

  @Delete(':id/widgets/:widgetId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiParam({ name: 'id', description: 'Dashboard ID', example: 'dashboard-1' })
  @ApiParam({ name: 'widgetId', description: 'Widget ID', example: 'widget-1' })
  @ApiOperation({ summary: 'Delete widget' })
  @ApiResponse({ status: 200, description: 'Widget deleted successfully' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteWidget(
    @Param('id') dashboardId: string,
    @Param('widgetId') widgetId: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.dashboardService.deleteWidget(dashboardId, widgetId, user.sub);
  }

  @Get(':id/widgets/:widgetId/data')
  @ApiParam({ name: 'id', description: 'Dashboard ID', example: 'dashboard-1' })
  @ApiParam({ name: 'widgetId', description: 'Widget ID', example: 'widget-1' })
  @ApiOperation({ summary: 'Get widget data' })
  @ApiResponse({ status: 200, description: 'Widget data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWidgetData(
    @Param('id') dashboardId: string,
    @Param('widgetId') widgetId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.dashboardService.getWidgetData(dashboardId, widgetId, user.sub);
  }

  // Real-time data endpoints
  @Get('metrics/realtime')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get real-time metrics' })
  @ApiResponse({ status: 200, description: 'Real-time metrics retrieved successfully', type: RealTimeMetricsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRealTimeMetrics(@CurrentUser() user: any): Promise<RealTimeMetricsDto> {
    return this.dashboardService.getRealTimeMetrics();
  }

  @Get('feed/orders')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiQuery({ name: 'limit', description: 'Number of feed items to return', required: false, example: 50 })
  @ApiOperation({ summary: 'Get real-time order feed' })
  @ApiResponse({ status: 200, description: 'Order feed retrieved successfully', type: [RealTimeOrderFeedDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOrderFeed(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ): Promise<RealTimeOrderFeedDto[]> {
    return this.dashboardService.getOrderFeed(limit);
  }
}
