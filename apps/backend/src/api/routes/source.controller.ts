import {
  Controller, Get, Header, NotFoundException, Param, Req,
  ServiceUnavailableException, StreamableFile, UnauthorizedException,
} from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Request } from 'express';
import { AuthService } from '@gitroom/helpers/auth/auth.service';
import { UsersService } from '@gitroom/nestjs-libraries/database/prisma/users/users.service';

// Source is available to every activated user, independent of plan or org role.
// This read-only authentication path does not create an organization API key.
@Controller('/source')
export class SourceController {
  constructor(private readonly users: UsersService) {}

  @Get('/:archive')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async download(@Req() request: Request, @Param('archive') archive: string) {
    const token = request.headers.auth || request.cookies?.auth;
    try {
      if (typeof token !== 'string') throw new Error('Missing session');
      const payload = AuthService.verifyJWT(token) as { id?: string };
      if (!payload || typeof payload.id !== 'string') throw new Error('Invalid session');
      const user = await this.users.getUserById(payload.id);
      if (!user?.activated) throw new Error('Inactive session');
    } catch {
      throw new UnauthorizedException('Sign in to download the source.');
    }

    const revision = process.env.RELEASE_SOURCE_REVISION || '';
    if (!/^[a-f0-9]{40}$/.test(revision)) {
      throw new ServiceUnavailableException('Source archive is not configured.');
    }
    if (archive !== `${revision}.tar.gz`) throw new NotFoundException();

    // The route parameter never becomes a filesystem path.
    const file = process.env.RELEASE_SOURCE_ARCHIVE || '/usr/src/lyfe-social-source.tar.gz';
    let size: number;
    try {
      const info = await stat(file);
      if (!info.isFile() || info.size === 0) throw new Error('Missing archive');
      size = info.size;
    } catch {
      throw new ServiceUnavailableException('Source archive is unavailable.');
    }
    return new StreamableFile(createReadStream(file), {
      type: 'application/gzip',
      disposition: `attachment; filename="lyfe-social-${revision}.tar.gz"`,
      length: size,
    });
  }
}
