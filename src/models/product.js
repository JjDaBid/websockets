import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ProductsSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  description: { type: String },
  price: { type: Number, required: true, index: true },
  stock: { type: Number, required: true },
  image: { type: String, required: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ProductsSchema.plugin(mongoosePaginate);

export default mongoose.model('Product', ProductsSchema);
