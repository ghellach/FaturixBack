import mongoose from 'mongoose';
import {v4 as uuid} from 'uuid';

const Product = new mongoose.Schema({
    publicId: {
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
    names: {
        type: Object,
        required: true,
        default: {
            en: "Product",
            fr: "Produit"
        }
    },
    price: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: "cad",
    },
    tax: {
        type: mongoose.Types.ObjectId,
        required: false,
    },
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