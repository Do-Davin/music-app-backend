// references.controller.ts
import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { ReferencesService } from './references.service';

@Controller('references')
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  /**
   * Download a reference material file from the database.
   * GET /references/:id/download
   */
  @Get(':id/download')
  async downloadFile(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const material = await this.referencesService.findOneWithFileData(id);

    if (!material.fileData) {
      throw new NotFoundException('This reference material has no file attached');
    }

    // Set appropriate headers for file download
    const contentType = material.mimeType || 'application/octet-stream';
    const fileName = material.fileName || 'download';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': material.fileData.length,
    });

    res.send(material.fileData);
  }
}
