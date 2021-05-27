import mongoose from 'mongoose';
import {v4 as uuid} from 'uuid';

const Company = mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true,
        default: () => uuid()
    },
    user : {
        type: mongoose.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true,
        max: 255
    },
    status: {
        type: Number,
        required: true,
        default: 1,
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

export default mongoose.model("Company", Company);