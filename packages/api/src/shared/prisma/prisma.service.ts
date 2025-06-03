import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from 'src/../generated/prisma';

@Injectable()
/**
 * @class PrismaService
 * @description A service that extends PrismaClient to manage database connections and operations.
 * It implements OnModuleInit to connect to the database when the module is initialized.
 */
export class PrismaService extends PrismaClient implements OnModuleInit {
  /**
   * @description Initializes the Prisma Client when the module is initialized.
   * @returns {Promise<void>}
   * @throws {Error} If the connection to the database fails.
   * @async
   */
  async onModuleInit(): Promise<void> {
    // Connect to the database using Prisma Client
    console.log('Connecting to the database...');
    // This will throw an error if the connection fails
    await this.$connect();
  }

  /**
   * @description Enables shutdown hooks for the Prisma Client. This ensures that the
   * Prisma Client disconnects gracefully when the application is shutting down.
   * @param {INestApplication} app - The NestJS application instance.
   */
  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', () => {
      app.close().catch((error) => {
        console.error('Error during application shutdown:', error);
      });
      console.log('Prisma Client is disconnecting...');
    });
  }
}
