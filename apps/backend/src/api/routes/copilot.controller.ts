import {
  Controller,
  Get,
  Post,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SubscriptionService } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/subscription.service';

@Controller('/copilot')
export class CopilotController {
  constructor(private _subscriptionService: SubscriptionService) {}

  // The owner Agent Room replaces the embedded assistant in this fork.
  // Respond even when a key exists; never start a model or a scheduling agent.
  @Post('/chat')
  chatAgent() {
    throw new ServiceUnavailableException(
      'Copilot is disabled. Open Agent Room.'
    );
  }

  @Post('/agent')
  agent() {
    throw new ServiceUnavailableException(
      'Copilot is disabled. Open Agent Room.'
    );
  }

  @Get('/:thread/list')
  getMessagesList() {
    throw new ServiceUnavailableException(
      'Copilot is disabled. Open Agent Room.'
    );
  }

  @Get('/list')
  getList() {
    throw new ServiceUnavailableException(
      'Copilot is disabled. Open Agent Room.'
    );
  }

  // Media generation uses this credit lookup independently of the assistant.
  @Get('/credits')
  calculateCredits(
    @GetOrgFromRequest() organization: Organization,
    @Query('type') type: 'ai_images' | 'ai_videos'
  ) {
    return this._subscriptionService.checkCredits(
      organization,
      type || 'ai_images'
    );
  }
}
