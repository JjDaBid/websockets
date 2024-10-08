import { Router } from 'express';
import Product from '../models/product.js';
import mongoose from 'mongoose';

const viewsRouter = Router();

viewsRouter.get('/', (req, res) => {
  res.redirect('/page/1');
  console.log("entra a /home ")
});

viewsRouter.get('/page/:page', async (req, res) => {
  try {
    const page = parseInt(req.params.page, 10) || 1;
    const products = await Product.paginate({}, { page, limit: 20 });
    res.status(200).render('layouts/home', { 
      products: products.docs, 
      pagination: {
        page: products.page,
        totalPages: products.totalPages,
        hasPrevPage: products.hasPrevPage,
        hasNextPage: products.hasNextPage,
        prevPage: products.prevPage,
        nextPage: products.nextPage
      }
    });
    console.log("redirigido a home paginado")
  } catch (error) {
    console.error('Error loading products:', error);
    res.status(500).render('error', { message: 'Error al cargar los productos' });
  }
});

viewsRouter.get('/:category/page/:page', async (req, res) => {
  try {
    const category = req.params.category;
    const page = parseInt(req.params.page, 10) || 1;
    const products = await Product.paginate({ category }, { page, limit: 20 });
    res.status(200).render('layouts/home', { 
      products: products.docs, 
      category: category,
      pagination: {
        page: products.page,
        totalPages: products.totalPages,
        hasPrevPage: products.hasPrevPage,
        hasNextPage: products.hasNextPage,
        prevPage: products.prevPage,
        nextPage: products.nextPage
      }
    });
  } catch (error) {
    console.error('Error loading products by category:', error);
    res.status(500).render('error', { message: 'Error al cargar los productos por categoría' });
  }
});

viewsRouter.get('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const foundProduct = await Product.findById(productId);
    if (!foundProduct) {
      return res.status(404).render('error', { message: 'Producto no encontrado' });
    }
    res.render('layouts/Product', { product: foundProduct });
  } catch (error) {
    console.error('Error loading product:', error);
    res.status(500).json('error', { message: 'Error al cargar el producto' });
  }
});

// viewsRouter.get('/realtimeproducts', (req, res) => {
//   console.log("entra a realtimeproducts")
//   res.redirect('/realtimeproducts/page/1');  
// });

viewsRouter.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await Product.find({})
    res.render('layouts/RealTimeProducts', { products });
  } catch (error) {
    res.status(500).render('error', { message: 'Error al cargar los productos' });
  }  
});

viewsRouter.get('/realtimeproducts/page/:page', async (req, res) => {
  try {
    console.log("redirigido a realtimeproducts")
    const page = parseInt(req.params.page, 10) || 1;
    const category = req.query.category || '';
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined;
    const sortOrder = req.query.sortOrder || '';

    let query = {};
    if (category) {
      query.category = category;
    }
    if (maxPrice) {
      query.price = { $lte: maxPrice };
    }

    let sort = {};
    if (sortOrder === 'asc') {
      sort = { price: 1 };
    } else if (sortOrder === 'desc') {
      sort = { price: -1 };
    }

    const products = await Product.paginate(query, { 
      page, 
      limit: 20,
      sort: sort
    });

    let productToEdit = {};
    if (req.query.id) {
      productToEdit = await Product.findById(req.query.id) || {};
    }

    res.status(200).render('layouts/RealTimeProducts', {
      products: products.docs,
      pagination: {
        page: products.page,
        totalPages: products.totalPages,
        hasPrevPage: products.hasPrevPage,
        hasNextPage: products.hasNextPage,
        prevPage: products.prevPage,
        nextPage: products.nextPage
      },
      productToEdit,
      filters: {
        category,
        maxPrice,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Error loading products:', error);
    res.status(500).render('error', { message: 'Error al cargar los productos' });
  }
});

viewsRouter.post('/addProduct', async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    const products = await Product.paginate({}, { page: 1, limit: 20 });
    req.app.get('socketio').emit('productListUpdate', products);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
});

// Ruta para actualizar un producto
viewsRouter.put('/updateProduct/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const products = await Product.paginate({}, { page: 1, limit: 20 });
    req.app.get('socketio').emit('productListUpdate', products);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});


// Ruta para eliminar un producto
viewsRouter.delete('/deleteProduct/:id', async (req, res) => {
  try {
    const { id } = req.params;    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }
    const deletedProduct = await Product.findByIdAndDelete(id);    
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const products = await Product.paginate({}, { page: 1, limit: 20 });
    req.app.get('socketio').emit('productListUpdate', products);    
    res.status(200).json({ success: true, message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});


viewsRouter.get('/cart', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];    
  }
  let total = req.session.cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  res.render('layouts/cart', { cart: req.session.cart, total: total });
});

viewsRouter.post('/cart/add', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];    
  }
  const newProduct = req.body;
  const existingProductIndex = req.session.cart.findIndex(item => item.id === newProduct.id);
  
  if (existingProductIndex > -1) {
      req.session.cart[existingProductIndex].quantity += parseInt(newProduct.quantity);
  } else {
      req.session.cart.push({
          ...newProduct,
          quantity: parseInt(newProduct.quantity)
      });
  }  
  res.status(200).json({ message: 'Producto agregado al carrito', cart: req.session.cart });
});

viewsRouter.post('/cart/update', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  const { id, quantity } = req.body;
  const productIndex = req.session.cart.findIndex(item => item.id === id);
  
  if (productIndex > -1) {
      req.session.cart[productIndex].quantity = parseInt(quantity);
  }
  
  res.status(200).json({ message: 'Carrito actualizado', cart: req.session.cart });
});

viewsRouter.post('/cart/remove', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }  
  const { id } = req.body;
  req.session.cart = req.session.cart.filter(item => item.id !== id);
  res.status(200).json({ message: 'Producto eliminado del carrito', cart: req.session.cart });
});

export default viewsRouter;
