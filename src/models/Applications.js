import {Schema, model} from 'mongoose';

const scheme = new Schema({
    status: {
        type: Boolean
    },
    message: String,
    to: {
        type: String,
        index: true,
        required: true
    },
    from: {
        type: String,
        index: true,
        required: true
    }
}, {
    timestamps: true
});

export default model('Applications', scheme);