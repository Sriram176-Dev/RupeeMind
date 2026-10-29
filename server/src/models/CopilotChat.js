import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    suggestions: [
      {
        type: String,
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: true }
);

const copilotChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'RupeeBot Advisory Session',
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

copilotChatSchema.index({ userId: 1, updatedAt: -1 });

export const CopilotChat = mongoose.model('CopilotChat', copilotChatSchema);
export default CopilotChat;
