import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SearchController } from './search.controller';
import { SearchService } from './services/search.service';
import { FilterService } from './services/filter.service';
import { QueryBuilderService } from './services/query-builder.service';
import { SearchIndexingService } from './services/search-indexing.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
    imports: [PrismaModule, ScheduleModule.forRoot()],
    controllers: [SearchController],
    providers: [SearchService, FilterService, QueryBuilderService, SearchIndexingService],
    exports: [SearchService, FilterService, QueryBuilderService, SearchIndexingService],
})
export class SearchModule { }
