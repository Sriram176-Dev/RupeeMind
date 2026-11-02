import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
    },
    previousTokenHash: {
      type: String,
      default: null,
    },
    rotatedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    onboardingDone: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    sessions: {
      type: [sessionSchema],
      default: [],
    },
    resetPasswordTokenHash: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ "sessions.tokenHash": 1 });
userSchema.index({ "sessions.previousTokenHash": 1 });
userSchema.index({ resetPasswordTokenHash: 1 });

export const User = mongoose.model("User", userSchema);
export default User;
