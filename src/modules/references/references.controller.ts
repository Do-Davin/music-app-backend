// references.controller.ts
//
// The old /download endpoint has been removed.
// Files are now stored on disk under uploads/references/ and served
// directly by express.static (configured in main.ts).
//
// This controller is kept for potential future REST endpoints.

import { Controller } from '@nestjs/common';
import { ReferencesService } from './references.service';

@Controller('references')
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}
}
