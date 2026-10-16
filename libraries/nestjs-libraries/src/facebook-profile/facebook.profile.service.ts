import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { randomUUID } from 'node:crypto';
import { applyNativeResult, checkLane, digest, isProfileIntegration, parseSettings, ProfileError, PROFILE_INTERNAL_ID, PROFILE_TOKEN } from './contract';

const postSelect = { id: true, organizationId: true, integrationId: true, state: true, content: true, image: true, settings: true, publishDate: true, releaseURL: true, releaseId: true, parentPostId: true, intervalInDays: true } as const;
@Injectable()
export class FacebookProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private enabled(orgId: string) {
    if (!(process.env.FACEBOOK_PROFILE_ORGANIZATIONS || '').split(',').map(s => s.trim()).filter(Boolean).includes(orgId)) throw new HttpException('Profile lane is not enabled', 404);
  }
  // Fail closed if the database protection is missing/disabled. No auto-DDL on startup.
  private async guardInstalled(db: any) {
    const rows = await db.$queryRaw`SELECT count(*)::int AS count FROM pg_trigger WHERE NOT tgisinternal AND tgenabled = 'A' AND ((tgname = 'bizbox_profile_post_v1' AND tgrelid = '"Post"'::regclass) OR (tgname = 'bizbox_profile_integration_v1' AND tgrelid = '"Integration"'::regclass))`;
    if (rows[0]?.count !== 2) throw new HttpException('Profile lane database guard unavailable', 503);
  }
  private async lane(orgId: string, db: any = this.prisma) {
    const lane = await db.integration.findFirst({ where: { organizationId: orgId, internalId: PROFILE_INTERNAL_ID, deletedAt: null, disabled: false, providerIdentifier: 'facebook', token: PROFILE_TOKEN } });
    if (!lane) throw new HttpException('Profile lane not found', 404);
    return lane;
  }
  async capabilities(orgId: string) {
    this.enabled(orgId);
    await this.guardInstalled(this.prisma);
    await this.lane(orgId);
    return { version: 1, nativeScheduledWriteback: true, draftOnly: true, exactMediaReadback: true };
  }
  async provision(orgId: string) {
    this.enabled(orgId);
    await this.guardInstalled(this.prisma);
    const lane = await this.prisma.integration.upsert({
      where: { organizationId_internalId: { organizationId: orgId, internalId: PROFILE_INTERNAL_ID } },
      update: {},
      create: { organizationId: orgId, internalId: PROFILE_INTERNAL_ID, providerIdentifier: 'facebook', type: 'social', name: 'Facebook profile (PC)', token: PROFILE_TOKEN },
    });
    const active = await this.lane(orgId);
    return { integrationId: active.id, name: lane.name, draftOnly: true };
  }
  // Called before the ordinary create/update path. Reserved entries never start Temporal.
  async interceptDraft(orgId: string, body: any, creationMethod: any) {
    const integrations = await this.prisma.integration.findMany({ where: { organizationId: orgId, id: { in: (body.posts || []).map((p: any) => p.integration.id) } } });
    const reserved = integrations.some(isProfileIntegration);
    const marked = body.posts?.some((p: any) => parseSettings(p.settings)?.bizboxFacebookProfile);
    if (!reserved && !marked) return null;
    this.enabled(orgId);
    await this.guardInstalled(this.prisma);
    const lane = await this.lane(orgId);
    if (body.type !== 'draft' || body.shortLink !== false || body.inter || body.order || body.posts.length !== 1 || body.tags?.length) throw new HttpException('Profile lane accepts only exact, single, nonrecurring drafts', 409);
    const entry = body.posts[0];
    if (entry.integration.id !== lane.id || entry.group || entry.value?.length !== 1 || entry.value[0].id || entry.value[0].delay) throw new HttpException('Profile drafts require a new exact lane item', 409);
    const value = entry.value[0];
    const proposed = { integrationId: lane.id, state: 'DRAFT', content: value.content, image: JSON.stringify(value.image), publishDate: entry.date || body.date, settings: entry.settings };
    const { lane: metadata } = this.checked(() => checkLane(proposed, lane.id));
    if (metadata.native) throw new HttpException('Native results require the result endpoint', 409);
    return this.prisma.$transaction(async tx => {
      // Serialize staging per org; retries reconcile this same immutable item instead of duplicating it.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${orgId + ':facebook-profile'}, 0))::text`;
      const existing = await tx.post.findMany({ where: { organizationId: orgId, integrationId: lane.id, deletedAt: null }, select: postSelect });
      const matches = existing.filter(p => { const m = parseSettings(p.settings)?.bizboxFacebookProfile; return m?.approvalId === metadata.approvalId && m?.itemId === metadata.itemId; });
      if (matches.length > 1) throw new HttpException('Duplicate profile item; reconcile before retry', 409);
      if (matches.length) {
        const saved = matches[0];
        const checked = this.checked(() => checkLane(saved, lane.id));
        if (digest(checked.lane.batch) !== metadata.digest || checked.lane.native) throw new HttpException('Conflicting profile draft', 409);
        return [{ postId: saved.id, integration: lane.id }];
      }
      await tx.$queryRaw`SELECT set_config('bizbox.profile_draft_v1', 'on', true)`;
      const saved = await tx.post.create({ data: { organizationId: orgId, integrationId: lane.id, state: 'DRAFT', content: proposed.content, image: proposed.image, settings: JSON.stringify(entry.settings), publishDate: new Date(proposed.publishDate), group: randomUUID(), creationMethod }, select: postSelect });
      this.checked(() => checkLane(saved, lane.id));
      return [{ postId: saved.id, integration: lane.id }];
    });
  }
  private checked<T>(operation: () => T): T {
    try { return operation(); } catch (err) {
      if (err instanceof ProfileError) throw new HttpException(err.message, err.status);
      throw err;
    }
  }
  async result(orgId: string, id: string, body: any) {
    this.enabled(orgId);
    await this.guardInstalled(this.prisma);
    const lane = await this.lane(orgId);
    const result = await this.prisma.$transaction(async tx => {
      // Tagged parameters, org + exact integration scoped lock, then read after the lock.
      const locked = await tx.$queryRaw<any[]>`SELECT id FROM "Post" WHERE id = ${id} AND "organizationId" = ${orgId} AND "integrationId" = ${lane.id} AND "deletedAt" IS NULL FOR UPDATE`;
      if (!locked.length) throw new HttpException('Post not found', 404);
      const post = await tx.post.findFirst({ where: { id, organizationId: orgId, integrationId: lane.id, deletedAt: null }, select: postSelect });
      if (!post) throw new HttpException('Post not found', 404);
      const data = this.checked(() => applyNativeResult(post, body, lane.id));
      await tx.$queryRaw`SELECT set_config('bizbox.profile_result_v1', 'on', true)`;
      const saved = await tx.post.update({ where: { id }, data, select: postSelect });
      this.checked(() => applyNativeResult(saved, body, lane.id));
      return saved;
    });
    // The transaction has committed when this is returned. GET /posts reads the same fields.
    return result;
  }
}
