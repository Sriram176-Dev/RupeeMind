import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['stock', 'fund', 'STOCK', 'MUTUAL_FUND'],
      required: true,
      set: (v) => (v ? v.toString().toUpperCase() : v),
    },
    symbolOrCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    buyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      default: function () {
        return this.buyPrice;
      },
    },
    buyDate: {
      type: Date,
      default: () => new Date(),
    },
    categoryOrSector: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Note: userId already has index: true in schema definition
holdingSchema.index({ symbolOrCode: 1 });

export const Holding = mongoose.model('Holding', holdingSchema);
export default Holding;
