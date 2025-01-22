# Configuring MongoDB in NestJS

This guide covers setting up MongoDB in a NestJS application, targeting experienced developers.

## Prerequisites

- Node.js (v12+)
- npm (v6+)
- MongoDB (local or cloud)
- NestJS CLI (`npm install -g @nestjs/cli`)

## Steps

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

### 2. Configure MongoDB Connection

Set the following in your `.env` file:

```dotenv
DB_USERNAME=<USERNAME>
DB_PASSWORD="<PASSWORD>"
DB_HOST=<HOST>
DB_NAME=<DB_NAME>
DB_APP_NAME={APP_NAME}
```

Or use a full URI:

```dotenv
DB_MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<HOST>/<DB_NAME>?retryWrites=true&w=majority&appName={APP_NAME}
```

### 3. Create a Model

Create `src/models/user.model.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  age: number;

  @Prop()
  mobile: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
```

### 4. Configure `AppModule`

Update `src/app.module.ts`:

```typescript
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './models/user.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    // other imports
  ],
  // controllers and providers
})
export class AppModule {}
```

### 5. Create a Service

Create `src/services/user.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.model';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(createUserDto: any): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async updateUser(id: string, updateUserDto: any): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

  async deleteUser(id: string): Promise<User> {
    return this.userModel.findByIdAndRemove(id).exec();
  }
}
```

## Conclusion

This guide provides a concise setup for integrating MongoDB with NestJS, focusing on essential steps for experienced developers.
