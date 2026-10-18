import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
    description: { type: String, trim: true, default: '', maxlength: 300 },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);

export default Category;