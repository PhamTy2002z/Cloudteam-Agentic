import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateDocDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
