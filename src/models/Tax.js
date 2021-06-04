import mongoose from 'mongoose';
import {v4 as uuid} from 'uuid';

const Tax = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true,
        default: () => uuid()
    },
    names: {
        type: Object,
        required: true,
    },
    rate: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        required: false
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

export default mongoose.model("Tax", Tax);