import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const UserSchema = new Schema({
  username: String,
  hashedPassword: String,
});

UserSchema.methods.setPassword = async function (password) {
  const hash = await bcrypt.hash(password, 10);
  this.hashedPassword = hash;
};

UserSchema.methods.checkPassword = async function (password) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result;
};

UserSchema.statics.findByUsername = function (username) {
  return this.findOne({ username }); //User
};

UserSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  return data;
};

UserSchema.methods.generateToken = function() {
    const token = jwt.sign(
        {
            _id: this.id,
            username: this.username,
        }, //토큰에 넣을 데이터
        process.env.JWT_SECRET, //JWT 암호
        {
            expiresIn: '7d', //유효기간
        },
    );
    return token;
};

const User = mongoose.model('User', UserSchema);
export default User;
