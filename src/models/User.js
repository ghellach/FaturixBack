import mongoose from 'mongoose';

const User = mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        max: 255
    },
    lastName: {
        type: String,
        required: true,
        max: 255
    },
    email: {
        type: String,
        required: true,
        max: 255
    },
    password: {
        type: String,
        required: true,
    },
    company: {
        type: mongoose.Types.ObjectId,
        required: false,
        ref: "Company"
    },
    status: {
        type: Number,
        required: true,
        default: 1
    }
});

export default mongoose.model("User", User);