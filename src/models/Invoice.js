import mongoose from 'mongoose';
import {v4 as uuid} from 'uuid';
import randomstring from 'randomstring'

const Invoice = mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true,
        default: () => uuid()
    },
    number: {
        type: String,
        required: true,
        unique: true,
        default: () => String(new Date().getFullYear())+"-"+String(randomstring.generate(7))
    },
    user: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User"
    },
    company: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Company"
    },
    items: {
        type: Object,
        required: false,
    },
    scanLink: {
        type: String,
        required: false
    },
    paid: {
        type: Boolean,
        required: true,
        default: false,
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

export default mongoose.model("Invoice", Invoice);