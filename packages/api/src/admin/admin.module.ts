import { Module } from '@nestjs/common';
import { ImportController } from './import/import.controller';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { BirdsController } from './birds/birds.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ImportController, BirdsController],
  providers: [],
})
export class AdminModule {}
