import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  GUIDANCE_TOPICS,
  GUIDANCE_VERSION,
  GuidanceTopic,
  findTopic,
} from './guidance.data';

@Injectable()
export class GuidanceService {
  /** Lightweight list for menus (no full step bodies). */
  list(category?: string) {
    const topics = category
      ? GUIDANCE_TOPICS.filter((t) => t.category === category)
      : GUIDANCE_TOPICS;
    return {
      version: GUIDANCE_VERSION,
      count: topics.length,
      topics: topics.map((t) => ({
        slug: t.slug,
        title: t.title,
        category: t.category,
        icon: t.icon,
        summary: t.summary,
      })),
    };
  }

  get(slug: string): GuidanceTopic {
    const topic = findTopic(slug);
    if (!topic) throw new NotFoundException(`No guidance topic "${slug}"`);
    return topic;
  }

  /**
   * Full offline bundle the mobile app caches. Includes a content checksum so
   * the client can skip re-downloading when nothing changed.
   */
  bundle() {
    const payload = { version: GUIDANCE_VERSION, topics: GUIDANCE_TOPICS };
    const checksum = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .slice(0, 16);
    return { ...payload, checksum, generatedAt: new Date().toISOString() };
  }
}
