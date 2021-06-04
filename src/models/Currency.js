import mongoose from 'mongoose';
import {v4 as uuid} from 'uuid';

const Currency = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true,
        default: () => uuid()
    },
    isoSign: {
        type: String,
        required: true,
    },
    isoName: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    updatedAt: {
        type: Date,
        required: true,
        default: () => new Date()
    },
});

export default mongoose.model("Currency", Currency);