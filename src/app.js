import express from 'express';
import http from 'http';
import handlebars from 'express-handlebars';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import session from 'express-session';
import sharedSession from 'socket.io-express-session';
import MongoStore from 'connect-mongo';
import viewsRouter from './routes/views.router.js';
import productsRouter from './routes/productsRouter.js';
import cartsRouter from './routes/cartsRouter.js';
import Product from './models/product.js';
import { initCart, calculateTotal } from './middleware/cart.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 8080;

app.engine('handlebars', handlebars.engine({
  extname: 'handlebars',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true
  },
  helpers: {
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }      
    },
    eq: function (v1, v2) {
      return v1 === v2;
    },
    formatPrice: function(price) {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
    },
    multiply: function(quantity, price) {
      return quantity * price;
    },
    calculateTotal: calculateTotal
  }
}));

app.set('view engine', 'handlebars');
app.set('views', join(__dirname, 'views'));

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://dabid:ABC12345*@coder1.ccr7l.mongodb.net/thestore?retryWrites=true&w=majority&appName=Coder1',
    ttl: 14 * 24 * 60 * 60 // 14 días
  }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 }
});

app.use(sessionMiddleware);

io.use(sharedSession(sessionMiddleware, {
  autoSave: true
}));

io.on('connection', (socket) => {
  socket.on('requestFilteredProducts', async (params) => {
    try {
      let query = {};
      if (params.category) {
        query.category = params.category;
      }
      if (params.maxPrice) {
        query.price = { $lte: parseFloat(params.maxPrice) };
      }

      let sort = {};
      if (params.sortOrder === 'asc') {
        sort = { price: 1 };
      } else if (params.sortOrder === 'desc') {
        sort = { price: -1 };
      }

      const products = await Product.paginate(query, { 
        page: params.page || 1, 
        limit: 20,
        sort: sort
      });
      socket.emit('productListUpdate', products);
    } catch (error) {
      console.error('Error al filtrar productos:', error);
      socket.emit('error', { message: 'Error al filtrar productos' });
    }
  });
});

app.set('socketio', io);

app.use(initCart);

app.use('/', viewsRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

mongoose.connect('mongodb+srv://dabid:ABC12345*@coder1.ccr7l.mongodb.net/thestore?retryWrites=true&w=majority&appName=Coder1');

server.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}`);
});

export default app;
