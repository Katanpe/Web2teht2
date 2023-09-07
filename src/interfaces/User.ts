import {Document} from 'mongoose';

interface User extends Document {
  user_name: string;
  email: string; // shoud be unique
  role: 'user' | 'admin'; // "user" or "admin" // don't send this
  password: string;
}

interface LoginUser extends User {
  username: string;
}

interface UserOutput {
  _id?: string;
  user_name: string;
  email: string;
}

interface UserTest {
  user_name: string;
  email: string;
  password: string;
}

export {User, LoginUser, UserOutput, UserTest};
