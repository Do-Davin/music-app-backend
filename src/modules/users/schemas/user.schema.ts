import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectType, Field, ID } from '@nestjs/graphql';

export type UserDocument = User & Document;

@ObjectType()               // GraphQL type
@Schema({ timestamps: true })
export class User {
  @Field(() => ID)
  _id: string;

  @Field()
  @Prop({ required: true })
  fullName: string;

  @Field()
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  // NOT exposed to GraphQL (no @Field)
  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: String, default: null })
  otpCode: string | null;

  @Prop({ type: Date, default: null })
  otpExpires: Date | null;

  @Field()
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);