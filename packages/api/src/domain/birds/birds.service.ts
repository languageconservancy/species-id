import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class BirdsService {
  constructor(private readonly prisma: PrismaService) {}

  // This service can be used to implement bird-related business logic
  // For example, you can add methods to fetch birds, create new birds, etc.

  // Example method to get all birds (this is just a placeholder)
  async getAllBirds(): Promise<any[]> {
    return await this.prisma.bird.findMany();
  }
}
