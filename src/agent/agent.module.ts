import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { ResourceSearchService } from './resource-search.service';

@Module({
  controllers: [AgentController],
  providers: [AgentService, ResourceSearchService],
})
export class AgentModule {}
