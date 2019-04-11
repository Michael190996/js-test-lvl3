import crypto from 'crypto';
import {Schema, model} from 'mongoose';

const scheme = new Schema({
    login: {
        type: String,
        unique: true,
        required: true,
        sparse: true
    },
    passwordHash: String,
    salt: String,
}, {
    timestamps: true
});

scheme.virtual('password').set(function (password) {
    this._plainPassword = password;

    if (password) {
        this.salt = crypto.randomBytes(128).toString('base64');
        this.passwordHash = crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1');
    } else {
        this.salt = undefined;
        this.passwordHash = undefined;
    }
}).get(function () {
    return this._plainPassword;
});

scheme.methods.checkPassword = function (password) {
    if (!password) return false;
    if (!this.passwordHash) return false;
    return crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1') == this.passwordHash;
};

export default model('User', scheme);