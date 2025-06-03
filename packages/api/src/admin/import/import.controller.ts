import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { diskStorage } from 'multer';

@Controller('api/admin')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('import-birds')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const uniqueSuffix = Date.now();
          callback(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.csv$/)) {
          return cb(
            new HttpException('Only CSV files are allowed!', HttpStatus.BAD_REQUEST),
            false
          );
        }
        cb(null, true);
      },
    })
  )
  async importBirds(@UploadedFile() file: Express.Multer.File): Promise<any> {
    return this.importService.importBirdCsv(file.path);
  }
}
