import { Router } from 'express';
import Cart from '../models/cart.js';

const router = Router();

router.post('/add', (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    const { id, title, image, price, quantity } = req.body;
    const existingItem = req.session.cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        req.session.cart.push({ id, title, image, price, quantity });
    }    
    res.redirect('/cart');
});
router.post('/remove', (req, res) => {
    const { id } = req.body;
    req.session.cart = req.session.cart.filter(item => item.id !== id);
    res.redirect('/cart');
});

router.post('/removeAll', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!req.session.cart) {
      return res.status(400).json({ error: 'No hay carrito en la sesión' });
    }
    req.session.cart = req.session.cart.filter(item => !ids.includes(item.id));
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    res.json({ message: 'Productos eliminados del carrito con éxito' });
  } catch (error) {
    console.error('Error al eliminar productos del carrito:', error);
    res.status(500).json({ error: 'Error al eliminar productos del carrito' });
  }
});

router.post('/update', (req, res) => {
    const { id, quantity } = req.body;
    const item = req.session.cart.find(item => item.id === id);    
    if (item) {
        item.quantity = quantity;
    }
    res.redirect('/cart');
});

router.get('/', async (req, res) => {
  try {
      const carts = await Cart.find();
      res.status(200).json(carts);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al obtener los carritos" });
  }
});

router.post('/', async (req, res) => {
  const { items } = req.body;
  if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito debe contener al menos un producto' });
  }
  try {
      const newCart = new Cart({ items });
      await newCart.save();
      res.status(201).json({ message: 'Carrito creado exitosamente', cart: newCart });
  } catch (error) {
      res.status(500).json({ error: 'Error al crear el carrito' });
  }
});

router.get('/:id', async(req, res) => {  
  try {
    const { id } = req.params; 
    const cart = await Cart.findById(id).populate('items.product');
    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }
    // Verifica si el populate funcionó
    console.log(JSON.stringify(cart, null, 2));
    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el carrito" });
  }
});

export default router;


