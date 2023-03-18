import mongoose from "mongoose";

export interface Prediction extends mongoose.Document {}

const predictionSchema = new mongoose.Schema({});

export const Prediction = mongoose.model<Prediction>("User", predictionSchema);
