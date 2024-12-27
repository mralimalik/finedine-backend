import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const phoneNumberSchema = new mongoose.Schema({
  
  countryCode: {
    type: String,
  },
  number: {
    type: String,
  },
},  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength:6,
      validate: {
        validator: function (value) {
          return value.length >= 6 && value.length <= 20;
        },
        message: 'Password must be between 6 and 20 characters',
      },
    },
    phoneNumber: {
      type: phoneNumberSchema,
    },
    changeLogo: {
      type: Boolean,
      default: true,
    },
    businessLogo:{
      type: String,
      default: '',
    },
    companyName:{
      type: String,
      default: '',
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
