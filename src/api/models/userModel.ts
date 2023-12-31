import {Schema, model} from 'mongoose';
import {User} from '../../interfaces/User';

const userSchema = new Schema<User>({
  user_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

export default model<User>('User', userSchema);
