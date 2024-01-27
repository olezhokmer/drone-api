import { UserDto } from './user.dto';

export class AuthenticationDto {
  token: string;
  user: UserDto;
}
