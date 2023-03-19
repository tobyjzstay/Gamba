import mongoose from "mongoose";
import { Prediction } from "./Prediction";
import { User } from "./User";

export interface Guild extends mongoose.Document {
    guildId: string;
    users: User[];
    predictions: Prediction[];
    archive: Prediction[];
}

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    users: { type: Array, required: true, default: [] }, // TODO
    predictions: { type: Array, required: true, default: [] },
    archive: { type: Array, required: true, default: [] },
});

export const Guild = mongoose.model<Guild>("Guild", guildSchema);
