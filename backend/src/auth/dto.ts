import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}

export class AppleDto {
  @IsString()
  @IsNotEmpty()
  identityToken!: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}
