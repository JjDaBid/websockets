import { Router } from 'express';
import { readProductsFromFile, writeProductsToFile } from '../utils/productUtils.js';

const viewsRouter = Router();

// Ruta para la vista principal
viewsRouter.get('/', (req, res) => {
    const products = readProductsFromFile();
    res.render('layouts/home', { products });
});

// Ruta para la vista de productos en tiempo real
viewsRouter.get('/realtimeproducts', (req, res) => {
    const products = readProductsFromFile();
    let productToEdit = {};

    if (req.query.id) {
        const productId = parseInt(req.query.id);
        productToEdit = products.find(product => product.id === productId) || {};
    }

    res.render('layouts/RealTimeProducts', { products, productToEdit });
});

// Ruta para la edición de un producto
viewsRouter.get('/edit/:id', (req, res) => {
    const products = readProductsFromFile();
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (product) {
        res.redirect(`/realtimeproducts?id=${product.id}`);
    } else {
        res.status(404).send('Producto no encontrado');
    }
});

// Ruta para agregar un producto
viewsRouter.post('/addProduct', (req, res) => {
  const { name, description, category, quantity, image } = req.body;
  const products = readProductsFromFile();
  const newProduct = {
      id: products.length ? products[products.length - 1].id + 1 : 1,
      name,
      description,
      category,
      quantity: parseInt(quantity),
      image
  };
  products.push(newProduct);
  writeProductsToFile(products);
  req.app.get('socketio').emit('productListUpdate', products);
  res.json(newProduct);
});

// Ruta para actualizar un producto
viewsRouter.post('/updateProduct', (req, res) => {
    const { id, name, description, category, quantity, image } = req.body;
    let products = readProductsFromFile();
    const index = products.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
        products[index] = { ...products[index], name, description, category, quantity: parseInt(quantity), image };
        writeProductsToFile(products);

        req.app.get('socketio').emit('productListUpdate', products);
        
        res.json(products[index]);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// Ruta para eliminar un producto
viewsRouter.post('/deleteProduct', (req, res) => {
    const { id } = req.body;
    let products = readProductsFromFile();
    products = products.filter(product => product.id !== parseInt(id));
    writeProductsToFile(products);    

    req.app.get('socketio').emit('productListUpdate', products);
    
    res.json({ success: true });
});

export default viewsRouter;
