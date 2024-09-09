import express from 'express';
import handlebars from 'express-handlebars';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import viewsRouter from './routes/views.router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}`);
});

const io = new Server(server);
app.set('socketio', io);

app.engine('handlebars', handlebars.engine({
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
      }
  }
}));

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'handlebars');

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', viewsRouter);

io.on('connection', (socket) => {
    console.log(`Conectado un nuevo socket con id: ${socket.id}`);
});
