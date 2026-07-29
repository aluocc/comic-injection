import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Registration payload.
 * - email: must be a valid email address.
 * - password: 8-32 chars, must contain at least one letter and one digit.
 * - nickname: 1-32 chars.
 */
export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message:
      'password must contain at least one letter and one digit',
  })
  password!: string;

  @IsString()
  @Length(1, 32)
  nickname!: string;
}
