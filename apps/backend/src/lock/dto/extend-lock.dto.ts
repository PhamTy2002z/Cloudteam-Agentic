import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class ExtendLockDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(120) // Max 2 hours extension
  minutes?: number;
}
