import {Schema, model} from 'mongoose';

const scheme = new Schema({
    name: {
        type: String,
        index: true,
        text: true
    },
    dateOfBirth: Date,
    login: {
        type: String,
        unique: true,
        required: true,
        sparse: true
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    }
}, {
    timestamps: true
});

scheme.pre('save', function (next) {
    this.name = `${this.lastName} ${this.firstName}`;
    next();
});

export default model('Profile', scheme);