import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { UsersService } from '../users/users.service';

class AnonymousTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  userId?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

  @Post('anonymous')
  async anonymousToken(@Body() dto: AnonymousTokenDto) {
    const user = await this.usersService.ensureUser(dto.userId, {
      locale: dto.locale,
      country: dto.country,
    });

    const payload = {
      sub: user.id,
      locale: user.locale,
      country: user.country,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      userId: user.id,
    };
  }
}
