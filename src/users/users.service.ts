import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signUp.dto';
import { User } from './schemas/user.schema';
import { UserTokenDto } from './dto/userToken.dto';
import { UserDto } from './dto/user.dto';
import { AuthenticationDto } from './dto/authentication.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async signUp(dto: SignUpDto) {
    const foundUser = await this.userModel.findOne({ email: dto.email });

    if (foundUser) {
      throw new BadRequestException('User already exists in a system.');
    }

    const hashedPass = await bcrypt.hash(
      dto.password,
      parseInt(process.env.BCRYPT_SALT),
    );
    const createdUser = new this.userModel({
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashedPass,
      email: dto.email,
    });

    const savedUser = await createdUser.save();
    return this.generateAuthenticationDto(savedUser);
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;
    const foundUser = await this.userModel.findOne({ email });

    if (!foundUser) {
      throw new NotFoundException('User does not exist in a system.');
    }

    const doesMatch = await bcrypt.compare(password, foundUser.password);

    if (!doesMatch) {
      throw new ForbiddenException('Wrong password provided.');
    }

    return this.generateAuthenticationDto(foundUser);
  }

  generateAuthenticationDto(
    user: User & {
      _id: Types.ObjectId;
    },
  ) {
    const userDto = this.getUserDto(user);
    const tokenPayload = {
      id: userDto.id,
      date: new Date().toISOString(),
    } as UserTokenDto;

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);

    return {
      user: userDto,
      token,
    } as AuthenticationDto;
  }

  async findByIdOrThrow(id: string) {
    const objectId = new Types.ObjectId(id);
    const user = await this.userModel.findById(objectId);

    if (!user) {
      throw new NotFoundException('User was not found.');
    }

    return user;
  }

  getUserDto(
    user: User & {
      _id: Types.ObjectId;
    },
  ) {
    const userId = user._id.toString();

    return {
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    } as UserDto;
  }
}
