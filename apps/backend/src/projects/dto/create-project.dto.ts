import { IsString, IsNotEmpty, MaxLength, IsUrl, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value.trim())
  name!: string;

  @IsUrl()
  @IsNotEmpty()
  repoUrl!: string;

  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsOptional()
  branch?: string = 'main';

  @IsString()
  @IsOptional()
  docsPath?: string = 'docs';
}
