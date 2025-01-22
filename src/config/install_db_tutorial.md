# Configuring MongoDB Connection and Creating Models in NestJS

NestJS is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. It leverages TypeScript, combining elements of OOP (Object Oriented Programming), FP (Functional Programming), and FRP (Functional Reactive Programming). One of the key features of NestJS is its ability to integrate seamlessly with various databases, including MongoDB.

MongoDB is a popular NoSQL database known for its flexibility, scalability, and ease of use. It stores data in JSON-like documents, making it a great choice for applications that require a flexible schema.

In this tutorial, we will walk you through the process of configuring a MongoDB connection in a NestJS application. We will also cover how to create a model for a MongoDB collection, which is analogous to a table in a relational database. By the end of this tutorial, you will have a solid understanding of how to set up and use MongoDB in your NestJS projects.

This tutorial is based on a premade template, which means you don't need to start from scratch. The template provides a basic structure and configuration, allowing you to focus on the MongoDB integration. Additionally, this template is a part of the "MicoMotion ecosystem".

## Prerequisites

Before we begin, make sure you have the following installed on your machine:

- Node.js (v12 or higher)
- npm (v6 or higher)
- MongoDB (You can use a local instance or a cloud-based service like MongoDB Atlas)
- NestJS CLI (You can install it globally using `npm install -g @nestjs/cli`)

## Overview

Here is a brief overview of what we will cover in this tutorial:

1. **Cloning or Forking the Template And Installing Dependencies**: We will start by cloning or forking the premade template from GitHub and Install the packages.
2. **Configuring MongoDB Connection**: We will configure the connection to MongoDB in our NestJS application.
3. **Creating a Model**: We will create a model for a MongoDB collection.
4. **Configuring AppModule**: We will configure the `AppModule` to include the necessary modules and services.
5. **Using the Model in a Service**: We will create a service that interacts with the MongoDB database using the model.

Let's get started!

---

## 1. Cloning or Forking the Template And Installing Dependencies

First, you need to clone or fork the premade template from GitHub. You can do this by running the following command in your terminal:

```bash
git clone <repository-url>
cd <repository-directory>
```

Replace `<repository-url>` with the URL of the GitHub repository and `<repository-directory>` with the name of the directory where the repository will be cloned.

Once you have cloned the repository, navigate to the project directory and install the necessary dependencies by running:

```bash
npm install
```

This will install all the required packages listed in the `package.json` file.

## 2. Configuring MongoDB Connection

The `src/config/mongodb.module.ts` file is already configured to establish a connection to MongoDB using environment variables. Ensure that the following environment variables are set in your `.env` file:

```dotenv
DB_USERNAME=<USERNAME>
DB_PASSWORD="<PASSWORD>"
DB_HOST=<LOCALHOST OR THE URL OF THE SERVER>
DB_NAME=<THE NAME OF THE DATABASE>
DB_APP_NAME=<Cluster0 (IF USING MONGODB SAAS SERVICE)>
```

**Or** if you want to write the full URI directly to the DB, you can use the following variable instead of the above variables. If `DB_MONGODB_URI` has a value, then the above variables will be ignored:

```dotenv
DB_MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<HOST>/<DB_NAME>?retryWrites=true&w=majority&appName={APP_NAME}
```

## 3. Creating a Model

To create a simplified model in NestJS with the fields `name`, `email`, `age`, and `mobile`, follow these steps:

1. **Define the Model Class**: Create a class that represents the model. Use the `@Schema` decorator to mark it as a schema, and the `@Prop` decorator to define the fields.

2. **Create the Schema**: Use the `SchemaFactory.createForClass` method to create a schema from the model class.

3. **Export the UserDocument Type**: The `UserDocument` type is created using the `HydratedDocument` utility from Mongoose, representing a fully populated document of the `User` model.

### Step-by-Step Example

1. **Define the Model Class**:
   Create a new file `src/models/user.model.ts` and define the model class with the simplified fields.

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  age: number;

  @Prop()
  mobile: string;
}
```

2. **Create the Schema**:
   Use the `SchemaFactory.createForClass` method to create a schema from the model class.

```typescript
export const UserSchema = SchemaFactory.createForClass(User);
```

3. **Export the UserDocument Type**:
   The `UserDocument` type is created using Mongoose's `HydratedDocument` utility. This type represents a complete document of the `User` model, including all its properties and methods. By exporting this type, you can use it in other parts of your application to ensure type safety and take advantage of TypeScript's features.

```typescript
export type UserDocument = HydratedDocument<User>;
```

### Full Example

Here is the complete code for the `src/models/user.model.ts` file:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

This example demonstrates how to create a simplified model in NestJS with the fields `name`, `email`, `age`, and `mobile`.

<hr>

## 4. Configuring `AppModule`

After setting up the MongoDB connection and creating the model, the next step is to configure the `AppModule` to include the necessary modules and services. 

This will ensure that your application can interact with the MongoDB database and use the created model.

### Step-by-Step Configuration

1. **Import the MongooseModule**: Import the `MongooseModule` and the `UserSchema` into the `AppModule`.

2. **Add the MongooseModule to the Imports Array**: Use the `MongooseModule.forFeature` method to register the `User` model with the `UserSchema`.

### Example

1. **Import the MongooseModule and UserSchema**:
   Open the `src/app.module.ts` file and import the necessary modules and schema.

2. **Add the MongooseModule to the Imports Array**:
   Register the `User` model with the `UserSchema` in the `imports` array of the `@Module` decorator.

```typescript
...
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
     MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), 
     ...
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {}
```

### Explanation

- **MongooseModule.forFeature**: This method registers the `User` model with the `UserSchema` in the `AppModule`. It allows the application to use the `User` model for database operations.
- **Imports Array**: The `MongooseModule` is added to the `imports` array, along with other necessary modules .


<hr>

## 5. Using the Model in a Service

After configuring the `AppModule` to include the `User` model, the next step is to create a service that will interact with the MongoDB database using this model. This service will provide methods to perform CRUD (Create, Read, Update, Delete) operations on the `User` collection.

### Step-by-Step Example

1. **Create the Service**: Generate a new service using the NestJS CLI or manually create a file for the service.
2. **Inject the Model**: Use the `@InjectModel` decorator to inject the `User` model into the service.
3. **Define CRUD Methods**: Implement methods for creating, reading, updating, and deleting users.

### Example

1. **Create the Service**:
   Create a new file `src/services/user.service.ts` and define the `UserService` class.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.model';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Method to create a new user
  async createUser(createUserDto: any): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  // Method to find all users
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  // Method to find a user by ID
  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  // Method to update a user by ID
  async updateUser(id: string, updateUserDto: any): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

  // Method to delete a user by ID
  async deleteUser(id: string): Promise<User> {
    return this.userModel.findByIdAndRemove(id).exec();
  }
}
```

### Explanation

- **InjectModel**: The `@InjectModel` decorator is used to inject the `User` model into the `UserService`. This allows the service to interact with the MongoDB collection.
- **CRUD Methods**: The service includes methods for creating, reading, updating, and deleting users. These methods use Mongoose's model methods to perform database operations.

### Full Example

Here is the complete code for the `src/services/user.service.ts` file:

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

This example demonstrates how to create a service in NestJS that uses the `User` model to perform CRUD operations on the MongoDB collection.



## Conclusion

In this tutorial, we have walked through the process of configuring a MongoDB connection in a NestJS application and creating a model for a MongoDB collection. We covered the following steps:

1. **Cloning or Forking the Template And Installing Dependencies**: We started by cloning or forking a premade template from GitHub and installing the necessary packages.
2. **Configuring MongoDB Connection**: We configured the connection to MongoDB using environment variables.
3. **Creating a Model**: We created a model for a MongoDB collection with fields `name`, `email`, `age`, and `mobile`.
4. **Configuring AppModule**: We configured the `AppModule` to include the necessary modules and services.
5. **Using the Model in a Service**: We created a service that interacts with the MongoDB database using the model, providing methods for CRUD operations.

By following these steps, you should now have a solid understanding of how to set up and use MongoDB in your NestJS projects. This setup allows you to leverage the flexibility and scalability of MongoDB while taking advantage of the powerful features provided by NestJS.

Feel free to expand on this foundation by adding more models, services, and controllers to build out your application further. Happy coding!
