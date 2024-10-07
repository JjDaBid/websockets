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

router.get('/productsByCategory/:category', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { category } = req.params;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const products = await Product.aggregate([
      {
        $match: { category: category }
      },
      {
        $skip: (pageNum - 1) * limitNum
      },
      {
        $limit: limitNum
      }
    ]);
    const totalProducts = await Product.countDocuments({ category: category });
    const totalPages = Math.ceil(totalProducts / limitNum);
    const result = {
      payload: products,
      currentPage: pageNum,
      totalPages: totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      nextPage: pageNum < totalPages ? pageNum + 1 : null,
      prevPage: pageNum > 1 ? pageNum - 1 : null,
      nextLink: pageNum < totalPages ? `/api/productsByCategory/${category}?page=${pageNum + 1}&limit=${limitNum}` : null,
      prevLink: pageNum > 1 ? `/api/productsByCategory/${category}?page=${pageNum - 1}&limit=${limitNum}` : null
    };
    res.json(result);
  } catch (error) {
    console.error(error);
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
