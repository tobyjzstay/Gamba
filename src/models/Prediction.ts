import mongoose from "mongoose";
import { v4 } from "uuid";
import { User } from "./User";

export interface Prediction extends mongoose.Document {
    name: string;
    uuid: string;
    outcomes: Outcome[];
    start: Date;
    end: Date;
    closed: boolean;
    ended: boolean;
}

type Outcome = {
    name: string;
    predictors: Predictor[];
};

type Predictor = {
    // TODO: store by prediction index?
    user: User;
    points: number;
};

const predictionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    uuid: { type: String, required: true, unique: true, default: v4 },
    outcomes: { type: Array, required: true, default: [] },
    start: { type: Date, required: true, default: Date.now }, // TODO: remove?
    end: { type: Date, required: true },
    closed: { type: Boolean, required: true, default: false },
    ended: { type: Boolean, required: true, default: false },
});

export function closePrediction(prediction: Prediction) {
    prediction.updateOne({ closed: true });
}

export const Prediction = mongoose.model<Prediction>("Prediction", predictionSchema);
