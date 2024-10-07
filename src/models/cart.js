import mongoose from "mongoose";

const CartSchema = new mongoose.Schema({
  items: {
    type:[
      {        
          product: { 
            type:mongoose.Schema.Types.ObjectId, 
            ref: 'Product'
          },   
      }
    ],
    default:[]
  },
  createdAt: { 
      type: Date, 
      default: Date.now
  }
});

CartSchema.pre(['find', 'findOne', 'findById'], function(next) {
    console.log("Middleware 'pre' para populate ejecutándose...");
    this.populate('items.product', 'items.title');
    
    next();
});

export default mongoose.model('Cart', CartSchema);
