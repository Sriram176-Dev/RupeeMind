import mongoose from 'mongoose';

const watchlistItemSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [watchlistItemSchema],
  },
  {
    timestamps: true,
  }
);

export const Watchlist = mongoose.model('Watchlist', watchlistSchema);
