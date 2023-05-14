import { Injectable, ConflictException, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

interface SignupParams {
  email: string;
  password: string;
  name: string;
  phone: string;
}

interface SigninParams {
  email: string;
  password: string;
}

interface GenerateProductKeyParams {
  email: string;
  userType: UserType;
}

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}
  async signup({ email, password, name, phone }: SignupParams) {
    const userExists = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    console.log(userExists);

    if (userExists) {
      throw new ConflictException();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(hashedPassword);

    const user = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        user_type: UserType.BUYER,
      },
    });

    return await this.generateJWT(name, user.id);
  }

  async signin({ email, password }: SigninParams) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new HttpException('Invalid credentials', 400);
    }

    const hashedPassword = user.password;

    const isValidPassowrd = await bcrypt.compare(password, hashedPassword);

    if (!isValidPassowrd) {
      throw new HttpException('Invalid credentials', 400);
    }

    return await this.generateJWT(user.name, user.id);
  }

  private async generateJWT(name: string, id: number) {
    const token = await jwt.sign({ name, id }, process.env.JSON_TOKEN_KEY, {
      expiresIn: 360000,
    });

    return token;
  }

  generateProductKey({ email, userType }: GenerateProductKeyParams) {
    const str = `${email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;

    return bcrypt.hash(str, 10);
  }
}
