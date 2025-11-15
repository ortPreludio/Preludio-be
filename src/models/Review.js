import { Schema, model } from 'mongoose';

const ReviewSchema = new Schema(
    {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Un usuario solo puede hacer una reseña
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Review", ReviewSchema)