import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { QueryOptimizerService } from './query-optimizer.service';

@Global()
@Module({
    providers: [PrismaService, QueryOptimizerService],
    exports: [PrismaService, QueryOptimizerService],
})
export class PrismaModule { }
