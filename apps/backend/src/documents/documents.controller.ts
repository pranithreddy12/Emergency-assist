import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/document.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a medical document (base64)' })
  upload(@CurrentUser() user: AuthUser, @Body() dto: UploadDocumentDto) {
    return this.service.upload(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my medical documents' })
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.userId);
  }

  @Get('raw/:id')
  @ApiOperation({ summary: 'Download document bytes' })
  async raw(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { bytes, contentType, label } = await this.service.raw(user.userId, id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${label}"`);
    res.send(bytes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
