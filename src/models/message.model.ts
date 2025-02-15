import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Model, Types } from "mongoose";
import { MODEL, MSG_STATUS, MSG_TYPE } from "../types/enum";


@Schema({ timestamps: true })
export class Message{
    @Prop({ required: true })
    body: string;

    @Prop({
        type: String,
        enum: Object.values(MSG_TYPE),
        default: MSG_TYPE.USER,
    })
    senderType:MSG_TYPE;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    senderId: Types.ObjectId;

    @Prop({type: Types.ObjectId, ref: 'Session'})
    sessionId: Types.ObjectId;

    @Prop({
        type: String,
        enum: Object.values(MSG_STATUS),
        default: MSG_STATUS.SENT,
    })
    status:MSG_STATUS;

    @Prop({
        type: String,
        enum: Object.values(MODEL),
        default: MODEL.DEEPSEEK,
    })
    llmType:MODEL;

    @Prop({ type: Boolean, default: true })
    enableLLM: boolean;

    @Prop({ type: Types.Map, default: {} })
    additionalFields: Record<string, any>;
    
    @Prop({ type: Types.Map, default: {} })
    metadata: Record<string, any>;
    
    @Prop({ type: Boolean, default: false })
    isDelete: boolean;
}

export type MessageDocument = HydratedDocument<Message>;
export const MessageSchema = SchemaFactory.createForClass(Message);
