import { Inject, Injectable, Logger } from '@nestjs/common';
import { TRIAGE_PROVIDER, TriageProvider, TriageInput, TriageResult } from './triage.types';

@Injectable()
export class TriageService {
  private readonly logger = new Logger(TriageService.name);

  constructor(@Inject(TRIAGE_PROVIDER) private readonly provider: TriageProvider) {
    this.logger.log(`Triage provider: ${provider.name}`);
  }

  assess(input: TriageInput): Promise<TriageResult> {
    return this.provider.assess(input);
  }
}
