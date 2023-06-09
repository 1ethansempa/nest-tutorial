import {
  Body,
  Controller,
  Param,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto, SignupDto, GenerateProductKeyDto } from '../dtos/auth.dto';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { User, UserTokenType } from '../decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup/:userType')
  async signup(
    @Body() body: SignupDto,
    @Param('userType', new ParseEnumPipe(UserType)) userType: UserType,
  ) {
    if (userType !== UserType.BUYER) {
      if (!body.productKey) {
        throw new UnauthorizedException();
      }

      const validProductKey = `${body.email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;

      const isValidProductKey = await bcrypt.compare(
        validProductKey,
        body.productKey,
      );

      console.log(isValidProductKey);

      if (!isValidProductKey) {
        throw new UnauthorizedException();
      }
    }
    return this.authService.signup(body);
  }

  @Post('/signin')
  sigin(@Body() body: SigninDto) {
    return this.authService.signin(body);
  }

  @Post('/key')
  generateProductKey(@Body() body: GenerateProductKeyDto) {
    return this.authService.generateProductKey(body);
  }

  @Get('/me')
  me(@User() user: UserTokenType) {
    return user;
  }
}
