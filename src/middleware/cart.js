export const initCart = (req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
};

export const calculateTotal = (cart) => {
  return cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
};
