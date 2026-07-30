import { Module } from '@nestjs/common';
import { AedController } from './aed.controller';

@Module({ controllers: [AedController] })
export class AedModule {}
