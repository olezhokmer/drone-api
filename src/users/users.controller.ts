import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RequestDto } from './dto/request.dto';
import { SignUpDto } from './dto/signUp.dto';
import { JwtAuthGuard } from './guards/jwtAuth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Put()
  signUp(@Body() body: SignUpDto) {
    return this.usersService.signUp(body);
  }

  @Post()
  login(@Body() body: LoginDto) {
    return this.usersService.login(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getUser(@Req() request: RequestDto) {
    return this.usersService.getUserDto(request.user);
  }
}
