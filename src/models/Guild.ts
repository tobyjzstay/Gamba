import mongoose from "mongoose";
import { Prediction } from "./Prediction";
import { User } from "./User";

export interface Guild extends mongoose.Document {
    guildId: string;
    users: User[];
    predictions: Prediction[];
    archive: Prediction[];
}

const guildSchema = new mongoose.Schema({});

export const Guild = mongoose.model<Guild>("Guild", guildSchema);
