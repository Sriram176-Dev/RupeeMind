import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema(
  {
    sourceId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['SEBI', 'TAX', 'AMC_FACTSHEET', 'RBI', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    chunkIndex: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

knowledgeChunkSchema.index({ sourceId: 1, chunkIndex: 1 });

export const KnowledgeChunk =
  mongoose.models.KnowledgeChunk ||
  mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
