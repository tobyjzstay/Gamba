import mongoose from "mongoose";

export interface User extends mongoose.Document {
    userId: string;
    points: number;
}

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    points: { type: Number, required: true, default: 0 },
});

export const User = mongoose.model<User>("User", userSchema);
