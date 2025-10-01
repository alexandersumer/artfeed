import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class FeedRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsPositive()
  count?: number;
}
