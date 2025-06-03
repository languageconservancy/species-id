import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { BirdOrder } from '../enums/bird-order.enum';

export class ImportBirdDto {
  /** Local name in the Native language */
  @IsString()
  @IsNotEmpty()
  nameLocal!: string[];

  /** English name */
  @IsString()
  @IsNotEmpty()
  nameEn!: string;

  /** Latin/scientific name */
  @IsString()
  @IsNotEmpty()
  nameLa!: string;

  /** English meaning of local name */
  @IsString()
  nameMeaningEn!: string;

  /** Description in local language */
  @IsString()
  descriptionLocal?: string;

  /** Description in English */
  @IsString()
  descriptionEn?: string;

  /** Taxonomic order (e.g. Passeriformes, Accipitriformes) */
  @IsEnum(BirdOrder)
  order?: BirdOrder;
}

export class ImportBirdsDto {
  /** List of birds */
  birds!: ImportBirdDto[];
}
