import mongoose from "mongoose";

const CartSchema = new mongoose.Schema({
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 }
    }],
    createdAt: { 
        type: Date, 
        default: Date.now
    }
});

// CartSchema.pre(['find', 'findOne', 'findById'], function(next) {
//     console.log("Middleware 'pre' para populate ejecutándose...");
//     this.populate('items.product', 'title', 'price');
//     next();
// });

export default mongoose.model('Cart', CartSchema);
