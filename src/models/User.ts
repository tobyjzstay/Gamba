import mongoose from "mongoose";

export interface User extends mongoose.Document {
    id: string;
    points: number;
}

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    points: { type: Number, required: true, default: 0 },
});

export const User = mongoose.model<User>("User", userSchema);
