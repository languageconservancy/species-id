import { Controller, Get } from '@nestjs/common';
import { BirdsService } from 'src/domain/birds/birds.service';

@Controller('birds')
export class BirdsController {
  constructor(private readonly birdsService: BirdsService) {}

  @Get()
  async getAllBirds(): Promise<any[]> {
    return await this.birdsService.getAllBirds();
  }
}
