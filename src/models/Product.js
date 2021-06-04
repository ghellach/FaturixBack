import mongoose from 'mongoose';
import {v4 as uuid} from 'uuid';

const unitTax = new mongoose.Schema({
    uuid: {
        type: String,
        required: false
    },
    names: {
        type: Object,
        required: true
    },
    rate: {
        type: Number,
        required: true
    }
})

const Product = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true,
        default: () => uuid()
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
    name: {
        type: String,
        required: true,
    },
    unitPrice: {
        type: Number,
        required: true,
    },
    currency: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    unitTaxes: [unitTax],
    image: {
        type: String,
        required: false,
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

export default mongoose.model("Product", Product);