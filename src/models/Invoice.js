import mongoose from 'mongoose';
import {v4 as uuid} from 'uuid';
import randomstring from 'randomstring'

const sums = mongoose.Schema({
    taxesTotal: {
        type: Number,
        required: true
    },
    subTotal: {
        type: Number,
        required: true
    },
    grossTotal: {
        type: Number,
        required: true
    }
});

const product = mongoose.Schema({
    _id: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    unit: {
        type: Object,
        required: true
    },
    total: {
        type: Object,
        required: true
    }
})

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
        default: () => String(new Date().getFullYear())+"-"+String(randomstring.generate({
            length: 7,
            charset: 'numeric'
        }))
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

    // core 
    currency: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    sums,
    grossTaxes: {
        type: Array,
        required: true
    },
    products: [product],

    
    scanLink: {
        type: String,
        required: false
    },
    finalized: {
        type: Boolean,
        required: true,
        default: false,
    },
    paid: {
        type: Boolean,
        required: true,
        default: false,
    },
    customerDetails: {
        type: Object,
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
    archive: {
        type: Array,
        required: true,
        default: []
    }
});

export default mongoose.model("Invoice", Invoice);