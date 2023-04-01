import mongoose from "mongoose";
import { User } from "./User";

import { Schema, Types } from "mongoose";
import { Prediction } from "./Prediction";

export interface Guild extends Document {
    id: string;
    users: User[];
    predictions: Prediction[];
    archive: Prediction[];
}

const GuildSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    users: [{ type: Types.ObjectId, ref: "User" }],
    predictions: [{ type: Types.ObjectId, ref: "Prediction" }],
    archive: [{ type: Types.ObjectId, ref: "Prediction" }],
});

export default mongoose.model<Guild>("User", GuildSchema);
