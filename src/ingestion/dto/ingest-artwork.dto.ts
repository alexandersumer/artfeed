import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class ImageDetailDto {
  @IsOptional()
  @IsString()
  detailIiif?: string;

  @IsOptional()
  @IsString()
  full?: string;
}

export class IngestArtworkDto {
  @IsString()
  @MaxLength(32)
  source!: string;

  @IsString()
  @MaxLength(128)
  sourceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  artist?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  artistId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  dateDisplay?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  medium?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  period?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsString()
  iiifManifestUrl?: string;

  @IsOptional()
  @IsString()
  iiifImageBase?: string;

  @IsOptional()
  @IsString()
  imageUrlFull?: string;

  @IsOptional()
  @IsString()
  imageUrl1080?: string;

  @IsOptional()
  @IsInt()
  width?: number;

  @IsOptional()
  @IsInt()
  height?: number;

  @IsOptional()
  @IsString()
  license?: string;

  @IsOptional()
  @IsString()
  rights?: string;

  @IsOptional()
  @IsString()
  creditLine?: string;

  @IsBoolean()
  isPublicDomain!: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAt?: Date;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  embedding!: number[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  embeddingModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  perceptualHash?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageDetailDto)
  imageDetail?: ImageDetailDto;
}
