const express = require('express');
const app = express();
const router = new express.Router();
const socketio = require('socket.io');
const hbs = require('express-handlebars');
const path = require('path');

router.use('/scripts', express.static('./ACAPE-Software/scripts'))
router.use('/APIS', express.static('./ACAPE-Software/APIS'))
router.use('/img', express.static('./ilustrations'))
router.use('/js', express.static('./js'))

router.use('/favicon.ico', (req, res) => res.sendFile(path.join(__dirname, './ACAPE-Software/icon.jpg')))

router.get('/', (req, res) => {
  res.render('index.html', {active_principal: "active", script_body: `<script src="/js/base.js"></script>`})
})

router.use((req, res, next) => {
  res.status(404).render('./errors/404.html');
});

app.set('port', 5000);
// app.enable('view cache');
app.engine('.html', hbs.engine({extname: ".html"}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, './views'))
app.use(router);

app.listen(80, () => {
  console.log('Servicio encendido en el localhost')
});