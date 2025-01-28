import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { Message } from "./message.model";


@Schema({ timestamps: true })
export class Session {
    @Prop({ required: true })
    title: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop([{ type: Types.ObjectId, ref: 'User' }])
    participants: Types.ObjectId[];

    // @Prop([{ type: Types.ObjectId, ref: 'Message' }])
    // messages: Types.ObjectId[];

    @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }])
    messages: Message[];
  

    @Prop({ type: Types.Map, default: {} })
    additionalFields: Record<string, any>;
    
    @Prop({ type: Types.Map, default: {} })
    metadata: Record<string, any>;
    
    @Prop({ type: Boolean, default: false })
    isDelete: boolean;

    @Prop({ type: Boolean, default: false })
    renamed: boolean;
}

export type SessionDocument = HydratedDocument<Session>;
export const SessionSchema = SchemaFactory.createForClass(Session);