import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_PROVIDER, StorageProvider } from '../storage/storage.types';
import { UploadDocumentDto } from './dto/document.dto';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  private async profileId(userId: string): Promise<string> {
    const profile = await this.prisma.medicalProfile.findUnique({ where: { userId } });
    if (profile) return profile.id;
    const created = await this.prisma.medicalProfile.create({ data: { userId } });
    return created.id;
  }

  async upload(userId: string, dto: UploadDocumentDto) {
    const bytes = Buffer.from(dto.data, 'base64');
    if (bytes.length === 0) throw new BadRequestException('Empty file');
    if (bytes.length > MAX_BYTES) throw new PayloadTooLargeException('File exceeds 15 MB');

    const profileId = await this.profileId(userId);
    const stored = await this.storage.put(bytes, dto.contentType, userId);

    const doc = await this.prisma.medicalDocument.create({
      data: {
        profileId,
        label: dto.label,
        storageKey: stored.key,
        contentType: stored.contentType,
        sizeBytes: stored.sizeBytes,
      },
    });
    return { ...doc, url: this.storage.url(stored.key) };
  }

  async list(userId: string) {
    const profileId = await this.profileId(userId);
    const docs = await this.prisma.medicalDocument.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => ({ ...d, url: this.storage.url(d.storageKey) }));
  }

  /** Returns raw bytes for streaming; verifies ownership. */
  async raw(userId: string, id: string) {
    const doc = await this.ownedDoc(userId, id);
    const obj = await this.storage.get(doc.storageKey);
    if (!obj) throw new NotFoundException('File data not found');
    return { ...obj, label: doc.label };
  }

  async remove(userId: string, id: string) {
    const doc = await this.ownedDoc(userId, id);
    await this.storage.delete(doc.storageKey);
    await this.prisma.medicalDocument.delete({ where: { id } });
    return { deleted: id };
  }

  private async ownedDoc(userId: string, id: string) {
    const doc = await this.prisma.medicalDocument.findUnique({
      where: { id },
      include: { profile: { select: { userId: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.profile.userId !== userId) throw new ForbiddenException('Not your document');
    return doc;
  }
}
