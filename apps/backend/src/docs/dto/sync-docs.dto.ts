import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class SyncDocsDto {
  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsBoolean()
  recursive?: boolean;
}
