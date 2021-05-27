import mongoose from 'mongoose';

const Session = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: false,
        ref: "User"
    },
    selectedCompany: {
        type: mongoose.Types.ObjectId,
        required: false,
        ref: "Company"
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: Number,
        required: true,
        default: 1
    },
    doesExpire: {
        type: Boolean,
        required: true,
        default: true,
    },
    selectedCompany: {
        type: Boolean,
        required: true,
        default: false
    },
    whichCompany: {
        type: mongoose.Types.ObjectId,
        required: false
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    expiresAt: {
        type: Date,
        required: false
    },
    clientType: {
        type: String,
        required: true,
        default: "b"
    },
    initialIp: {
        type: String,
        required: true
    }
});

export default mongoose.model("Session", Session);