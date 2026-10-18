import mongoose from 'mongoose';

const MOVEMENT_TYPES = ['IN', 'OUT', 'ADJUST'];

const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: { type: String, enum: MOVEMENT_TYPES, required: true, index: true },
    quantity: { type: Number, required: true },
    reason: { type: String, default: '', maxlength: 300 },
    reference: {
      type: { type: String, enum: ['invoice', 'manual', 'adjustment'], default: 'manual' },
      id: { type: mongoose.Schema.Types.ObjectId, refPath: 'reference.model', default: null },
      model: { type: String, default: null },
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

export default StockMovement;
export { MOVEMENT_TYPES };