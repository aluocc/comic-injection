import { IsString, Length, MinLength } from 'class-validator';

/**
 * Login payload.
 * `account` may be either an email or a phone number.
 */
export class LoginDto {
  @IsString()
  @Length(3, 255)
  account!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
