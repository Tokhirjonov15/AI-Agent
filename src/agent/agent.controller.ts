import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Query,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { ChatRequestDto } from './dto/chat.dto';
import { SmsRequestDto } from './dto/sms.dto';

@Controller('api')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('agent')
  async askAgent(@Body() body: ChatRequestDto) {
    if (!body?.question?.trim()) {
      throw new BadRequestException('question is required');
    }

    try {
      return await this.agentService.askAgent(
        body.question.trim(),
        body.goal?.trim() || '',
        body.history || [],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new InternalServerErrorException(message);
    }
  }

  @Get('search')
  async search(@Query('q') query?: string) {
    if (!query?.trim()) {
      throw new BadRequestException('q is required');
    }

    try {
      return await this.agentService.search(query.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new InternalServerErrorException(message);
    }
  }

  @Post('sms')
  async sms(@Body() body: SmsRequestDto) {
    if (!body?.to?.trim() || !body?.message?.trim()) {
      throw new BadRequestException('to and message are required');
    }

    try {
      return await this.agentService.sendSms(body.to.trim(), body.message.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new InternalServerErrorException(message);
    }
  }
}
