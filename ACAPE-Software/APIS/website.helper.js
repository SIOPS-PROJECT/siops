const path = require('node:path');
const api_db = require('./APIS/database.js');
const {siops} = require('./APIS/token.js');
const validator = new siops();
const express = require('express');
const server = express();
const converterArray = api_db.converterArray;

const database = new api_db({
  user: "acape",
  password: "admin"
})

server.set('port', 9000);

const service = server.listen(server.get('port'));

const socketio = require('socket.io');
const io = socketio(service);

io.on('connect', (socket) => {
  socket.on('token_validation', (data) => {
    validator.start(data, (data, err) => {
      socket.emit('token_validation', data?data:err);
    })
  })
  socket.on('get_token_valid', (data) => {
    validator.start(data, (data, err) => {
      socket.emit('get_token_valid', data?data:err);
    })
  })
  socket.on('login-acape', (data) => {
    const users = database.db.getData('users');
    const users_array = converterArray(users);

    const validatorUsers = users_array[0];
    if(!validatorUsers) {
      let user = database.createUser(data.user, data.password, 'owner');
      socket.emit('login-acape', user);
    }else {
      let receivedUser = database.getUser(data.user, data.password);
      if(!receivedUser.data){
        socket.emit('message', receivedUser)
      }else {
        socket.emit('login-acape', receivedUser);
      }
    }
  })
  socket.on('session-validator', (data) => {
    let user = database.getUserToken(data);
    socket.emit('session-validator', user);
  })


  // PRODUCTS MANAGER
  socket.on('createProduct', (data = {token: null, product: {}}) => {
    if(!data.token) return socket.emit('products-manager', {message: "Agrega el token para poder acceder a las funciones."});
    if(!data.product) return socket.emit('products-manager', {message: "Agrega la información del producto."});

    return socket.emit('products-manager', database.createProduct(data.product, data.token));
  });

  // EDIT PRODUCTS
  socket.on('editProduct', (data = {}) => {
    if(!data.token) return socket.emit('products-manager', {message: "Agrega el token para poder acceder a las funciones."});
    if(!data.product) return socket.emit('products-manager', {message: "Agrega la información del producto"});

    return socket.emit('products-manager', database.editProduct(data.product.id, data.product, data.token));
  })

  socket.on('deleteProduct', (data = {}) => {
    if(!data.token) return socket.emit('products-manager', {message: "Agrega el token para acceder a las funciones."});
    if(!data.product) return socket.emit('products-manager', {message: "Agrega el id del producto"});

    return socket.emit('products-manager', database.deleteProduct(data.product, data.token));
  })

  socket.on('getAllProducts', (data) => {
    return socket.emit('getAllProducts', database.getAllProducts(data));
  })

  socket.on('getProductsScan', (data) => {
    return socket.emit('getProductsScan', database.getAllProducts(data));
  })

  socket.on('getAllVentas', (data) => {
    return socket.emit('getAllVentas', database.getAllVentas());
  }) 


  // ROLE MANAGER

  socket.on('createRole', (data = {}) => {
    if(!data.token) return socket.emit('role-manager', {message: "Agrega el token para poder acceder a las funciones."});
    if(!data.role) return socket.emit('role-manager', {message: "Agrega la información del rol."});

    return socket.emit('role-manager', database.createRole(data.role, data.token));
  })

  socket.on('editRole', (data = {}) => {
    if(!data.token) return socket.emit('role-manager', {message: "Agrega el token para poder acceder a las funciones"});
    if(!data.role) return socket.emit('role-manager', {message: "Agrega la información del rol"});
    if(!data.role.perms) return socket.emit('role-manager', {message: "Agrega la información de permisos."});

    return socket.emit('role-manager', database.editRole(data.role, data.token));
  })

  socket.on('deleteRole', (data = {}) => {
    if(!data.token) return socket.emit('role-manager', {message: "Agrega el token para poder acceder a las funciones."});
    if(!data.role) return socket.emit('role-manager', {message: "Agrega el nombre del rol para poder eliminarlo."});

    return socket.emit('role-manager', database.deleteRole(data.role, data.token));
  })

  // VENTAS MANAGER
  socket.on('createVenta', (data = {}) => {
    if(!data.venta) return socket.emit('ventas-manager', {message: "Agrega la información de venta."});
    if(!data.total_recibido) return socket.emit('ventas-manager', {message: "Agrega el total recibido por parte del cliente."});
    if(!data.token) return socket.emit('ventas-manager', {message: "Agrega el token para registrar la venta con tu usuario."});

    return socket.emit('ventas-manager', database.createVenta(data.venta, data.total_recibido, data.token, data.mayor));
  })

  socket.on('editVenta', (data = {}) => {
    if(!data.venta) return socket.emit('ventas-manager', {message: "Agrega la información de la venta."});
    if(!data.venta.id) return socket.emit('ventas-manager', {message: "Agrega el id de la venta."});
    if(!data.total_recibido) socket.emit('ventas-manager', {message: "Agrega el total recibido del cliente."});

    return socket.emit('ventas-manager', database.editVenta(data.venta, data.total_recibido));
  })
  socket.on('deleteVenta', (data = {}) => {
    if(!data.venta) return socket.emit('ventas-manager', {message: "Agrega la información de la venta."});

    return socket.emit('ventas-manager', database.deleteVenta(data.venta));
  })

  socket.on('deleteVentaEdit', (data = {}) => {
    if(!data.venta) return socket.emit('ventas-manager', {message: "Agrega la información de la venta."});

    let dataToSend = database.deleteVenta(data.venta);
    dataToSend.return = false;
    return socket.emit('ventaEdit', dataToSend);
  })


  // CLIENTES MANAGER
  socket.on('createClient', (data = {}) => {
    if(!data.client) return socket.emit('clientes-manager', {message: "Agrega la información del cliente"});
    if(!data.token) return socket.emit('clientes-manager', {message: "Agrega el token para acceder a la información"});

    return socket.emit('clientes-manager', database.createClient(data.client, data.token));
  })
  socket.on('editClient', (data) => {
    if(!data.client) return socket.emit('clientes-manager', {message: "Agrega la información del cliente"});
    if(!data.token) return socket.emit('clientes-manager', {message: "Agrega el token para acceder a la información"});

    return socket.emit('clientes-manager', database.editClient(data.client, data.token));
  })
  socket.on('deleteClient', (data) => {
    if(!data.client) return socket.emit('clientes-manager', {message: "Agrega la información del cliente."});
    if(!data.token) return socket.emit('clientes-manager', {message: "Agrega el token para poder acceder a la informacón."});

    return socket.emit('clientes-manager', database.deleteClient(data.client, data.token));
  })

  socket.on('getAllClients', (data) => {
    if(!data) return socket.emit('clientes-manager', {message: "Agrega el token del usuario."});

    return socket.emit('getAllClients', database.getClients(data));
  })

  // USERS FUNCTIONS

  socket.on('createUser', (data) => {
    if(!data.user) return socket.emit('user-manager', {message: "Agrega la información del usuario"});
    if(!data.token) return socket.emit('user-manager', {message: "Agrega el token del usuario."});

    return socket.emit('user-manager', database.adminCreateUser(data.user, data.token));
  })

  socket.on('editUser', (data) => {
    if(!data.user) return socket.emit('user-manager', {message: "Agrega la información del usuario"});
    if(!data.token) return socket.emit('user-manager', {message: "Agrega el token del usuario."});

    return socket.emit('user-manager', database.adminEditUser(data.user, data.token));
  })

  socket.on('deleteUser', (data) => {
    if(!data.user) return socket.emit('user-manager', {message: "Agrega la información del usuario"});
    if(!data.token) return socket.emit('user-manager', {message: "Agrega el token del usuario."});

    return socket.emit('user-manager', database.adminDeleteUser(data.user, data.token));
  })

  // FUNCTIONS VARIATED

  socket.on('createSpace', () => {
    createWindow();
  })
  socket.on('getAllData', (token) => {
    if(!token) return socket.emit('allData', {message: "Agrega el token."});

    if(!database.validatePerms(token, 'facturar')) return socket.emit('allData', {message: "Parece que no tienes permisos suficientes."});
    let all_data = database.db.start().data.simple;
    all_data.users = undefined;
    all_data.id = undefined;
    all_data.roles = undefined;
    all_data.logs = undefined;
    return socket.emit('allData', {message: "All Data", data: all_data});
  })

  socket.on('imprimirFactura', (data) => {
    let facturaImprimible = data;
    let id = new Date()-0;
    server.get(`/factura/${id}`, (req, res) => {
      res.send(data);
    })
    imprimirFactura(`/factura/${id}`);

    socket.emit('imprimirFactura', {id: id});
  })

  socket.on('configServ', (token) => {
    if(!token) return socket.emit('configServ', {message: "Tienes que tener una sesion iniciada para acceder a este servicio."});

    if(!database.validatePerms(token, 'all')) return socket.emit('configServ', {message: "Parece que no tienes permisos suficientes para configurar esto."});

    socket.emit('configServ', {message: "Acceso concedido", data: database.db.start().data.simple})
  })

  // MOVIMIENTOS DE CAJA
  socket.on('registrarCaja', (data = {}) => {
    return socket.emit('caja-manager', database.registrarCaja(data.caja, data.token));
  })

  socket.on('reabrirCaja', (token) => {
    if(!database.validatePerms(token, 'all')) return socket.emit('reabrirCaja', database.validatePerms(token, 'all'));

    return socket.emit('reabrirCaja', database.db.getData('caja'));
  })
})

// database configuration

database.start();

module.exports = {service, database, io, server}