import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { createHash } from 'crypto';
import { findTopic } from '../guidance/guidance.data';
import { containsUnsafeMedicalClaim } from '../triage/triage.guardrails';
import { EmergencyNumberService } from '../emergency-number/emergency-number.service';
import {
  RECOGNIZER_NODES,
  RECOGNIZER_VERSION,
  ROOT_ID,
  RecognizerNode,
  findNode,
} from './recognizer.data';

@Injectable()
export class RecognizerService implements OnModuleInit {
  constructor(private readonly emergencyNumbers: EmergencyNumberService) {}

  /**
   * Fail fast at boot if the tree is malformed. Three invariants keep the
   * recognizer safe: every branch points somewhere real, every terminal opens
   * an existing guidance topic, and no immediate action slips past the
   * no-diagnosis / no-prescription guardrail.
   */
  onModuleInit() {
    for (const node of RECOGNIZER_NODES) {
      for (const opt of node.options) {
        const hasNext = !!opt.next;
        const hasRoute = !!opt.route;
        if (hasNext === hasRoute) {
          throw new Error(
            `Recognizer "${node.id}" option "${opt.label}" must have exactly one of next/route`,
          );
        }
        if (opt.next && !findNode(opt.next)) {
          throw new Error(`Recognizer "${node.id}" points to missing node "${opt.next}"`);
        }
        if (opt.route) {
          if (!findTopic(opt.route.guidanceSlug)) {
            throw new Error(
              `Recognizer "${node.id}" routes to unknown guidance "${opt.route.guidanceSlug}"`,
            );
          }
          if (containsUnsafeMedicalClaim(opt.route.immediateAction)) {
            throw new Error(
              `Recognizer "${node.id}" action fails safety guardrail: "${opt.route.immediateAction}"`,
            );
          }
        }
      }
    }
    if (!findNode(ROOT_ID)) throw new Error(`Recognizer missing root node "${ROOT_ID}"`);
  }

  start(country?: string) {
    return this.node(ROOT_ID, country);
  }

  /**
   * Return a node plus the number to dial. `country` (ISO 3166-1 alpha-2)
   * resolves to the local emergency number; without it the response still
   * carries the 112 universal fallback so there is always a number to show.
   */
  node(id: string, country?: string): RecognizerNode & { emergencyNumber: string } {
    const node = findNode(id);
    if (!node) throw new NotFoundException(`No recognizer node "${id}"`);
    return { ...node, emergencyNumber: this.emergencyNumbers.forCountry(country).number };
  }

  /** Full offline bundle the mobile app caches, with a content checksum. */
  bundle() {
    const payload = { version: RECOGNIZER_VERSION, rootId: ROOT_ID, nodes: RECOGNIZER_NODES };
    const checksum = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .slice(0, 16);
    return { ...payload, checksum, generatedAt: new Date().toISOString() };
  }
}
