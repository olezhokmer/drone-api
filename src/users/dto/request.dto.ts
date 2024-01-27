import { Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Request } from 'express';

export interface RequestDto extends Request {
  user: User & {
    _id: Types.ObjectId;
  };
}
