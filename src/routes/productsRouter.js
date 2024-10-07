import { Router } from 'express';
import Product from '../models/product.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query
        const products = await Product.paginate({},{page, limit});
        const result = {
          payload: products.docs,
          nextPage: products.nextPage,
          prevPage: products.prevPage,
          hasNextPage: products.hasNextPage,
          hasPrevPage: products.hasPrevPage,
          nextLink: `/api/products/${products.nextPage}`,
          prevLink: `/api/products/${products.prevPage}`
        }
        res.json(result);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
});

// Ruta para obtener un producto específico
router.get('/:id', async (req, res) => {  
  try {
      const productDetails = await Product.findById(req.params.id);
      if (!productDetails) {
          return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json(productDetails);
  } catch (error) {
      res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

router.post('/', async (req, res) => {
    try {
        const newProduct = await Product.create(req.body);
        req.app.get('socketio').emit('productUpdated', newProduct);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el producto' });
    }
});

router.put('/:id', async (req, res) => {
  try {
      const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      
      if (!updatedProduct) {
          return res.status(404).json({ error: 'Producto no encontrado' });
      }      
      req.app.get('socketio').emit('productUpdated', updatedProduct);
      res.json(updatedProduct);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
      const deletedProduct = await Product.findByIdAndDelete(req.params.id);
      
      if (!deletedProduct) {
          return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      req.app.get('socketio').emit('productDeleted', req.params.id);
      res.json({ message: 'Producto eliminado' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});


export default router;
