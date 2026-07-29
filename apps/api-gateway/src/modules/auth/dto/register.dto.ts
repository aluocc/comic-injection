import { IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(40) username: string;
  @IsString() @MinLength(8) @MaxLength(64) password: string;
}
