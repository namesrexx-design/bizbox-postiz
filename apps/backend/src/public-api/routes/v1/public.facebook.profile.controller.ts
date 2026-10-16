import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { FacebookProfileService } from '@gitroom/nestjs-libraries/facebook-profile/facebook.profile.service';

@Controller('/public/v1/facebook-profile')
export class PublicFacebookProfileController {
  constructor(private readonly profiles: FacebookProfileService) {}

  @Get('/capabilities')
  capabilities(@GetOrgFromRequest() org: Organization) {
    return this.profiles.capabilities(org.id);
  }

  // Provision only after org allowlisting + database guard installation. No Facebook call.
  @Post('/lane')
  provision(@GetOrgFromRequest() org: Organization) {
    return this.profiles.provision(org.id);
  }

  @Put('/posts/:id/result')
  result(@GetOrgFromRequest() org: Organization, @Param('id') id: string, @Body() body: any) {
    return this.profiles.result(org.id, id, body);
  }
}
