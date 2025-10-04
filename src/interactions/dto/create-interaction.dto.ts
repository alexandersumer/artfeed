import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateInteractionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  artworkId!: number;

  @IsString()
  @IsIn(["impression", "like", "save", "hide", "share", "open", "zoom", "skip"])
  eventType!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  dwellMs?: number;

  @IsOptional()
  @IsNumber()
  scrollVelocity?: number;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  modelVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  requestId?: string;
}
