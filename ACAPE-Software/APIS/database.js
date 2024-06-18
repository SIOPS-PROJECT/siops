// VARIABLES

const {Admin} = require('fortydb');
const sha256 = require('crypto-js/sha256');
const sha3 = require('crypto-js/sha3');
const {converter, timems, getTime, getTimeLong, getRemainTime, forDate} = require('./timems-server.js');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');


// GENERAR TOKENS PARA LOS PRODUCTOS, MERAMENTE PRODUCTOS

function generarToken(numeroUsuario) {
  // Convertir el número a string
  const numeroString = numeroUsuario.toString();

  // Combinar el número con una cadena aleatoria
  const cadenaAleatoria = crypto.randomBytes(30).toString('hex'); // Genera 20 bytes aleatorios en hexadecimal
  const cadenaCombinada = numeroString + cadenaAleatoria;

  // Generar un UUID usando la cadena combinada
  const token = uuidv4(cadenaCombinada);

  // Devolver el token
  return token;
}

// CONVERTIR CUALQUIER OBJETO EN UN ARREGLO 

function converterArray(object){
	let keys = Object.keys(object);
	let arrayToReturn = [];
	
	keys.forEach((element, i, array) => {
		arrayToReturn.push(object[element]);
	})

	return arrayToReturn;
}


// CLASE PRINCIPAL
class Database {

	// RECIBIR TODOS LOS DATOS DEL USUARIO
	constructor(config = {}){
		this.user = config.user?config.user:"admin";
		this.password = config.password?config.password:"server";
		this.route = config.route?config.route:"./system",
		this.name = config.name;
		this.db = null;
		this.data = null;
		this.logs = new Admin({
			route: this.route,
			user: {
				user: this.user,
				password: this.password
			},
			name: "logs.fdb"
		})
	}

	// INICIALIZAR LA BASE DE DATOS Y GUARDAR TODAS LAS CATEGORIAS DE TRABAJO
	start(){
		this.db = new Admin({
			route: this.route,
			user: {
				user: this.user,
				password: this.password
			}
		})

		// EN CASO DE QUE NO EXISTE ALGUNA DE ESTAS CATEGORIAS SE CREA, EN TANTO LA MAS IMPORTANTE ES LA DE USUARIOS Y DESPUES LA ID
		if(!this.db.getData('products')) this.db.setData('products', {});
		if(!this.db.getData('users')) this.db.setData('users', {});
		if(!this.db.getData('id')) this.db.setData('id', {
			users: 0,
			products: 0,
			ventas: 0,
			logs: 0,
			clientes: 0,
			caja: 0
		});
		if(!this.db.getData('ventas')) this.db.setData('ventas', {});
		if(!this.db.getData('logs')) this.db.setData('logs', {});
		if(!this.db.getData('clientes')) this.db.setData('clientes', {});
		if(!this.db.getData('caja')) this.db.setData('caja', {});


		// VALIDACIÓN DE ROLES
		if(!this.db.getData('roles')) this.db.setData('roles', {
			owner: {
				all: true,
				productManager: true,
				userManager: true,
				roleManager: true,
				view: true,
				clientManager: true,
				facturar: true
			},
			user: {
				view: true
			}
		})

		return this.db.start();
	}

	// REGISTRO DE CAJA
	registrarCaja(newCaja, token){
		if(!newCaja) return {message: "Agrega la información de la caja."};
		if(!token) return {message: "Agrega el usuario que hace el movimiento y cierre de la caja."};

		let validateUser = this.validatePerms(token, 'facturar');
		if(!validateUser) return {message: "El usuario parece no tener permisos"};

		let data = this.db.start().data.simple;
		let ids = data['id'];
		let caja = data['caja'];

		if(!newCaja.date) return {message: "La fecha de la caja no existe, agrega una para poder registrarla"};

		newCaja.cerrada = new Date()-0;
		newCaja.timeLapse = newCaja.date - new Date()-0;
		newCaja.closedBy = token;

		ids['caja'] = ids['caja'] + 1;

		newCaja.id = newCaja.id?newCaja.id:ids.caja;

		caja[newCaja.id?newCaja.id:ids.caja] = newCaja;
		this.db.setData('caja', caja);
		this.db.setData('id', ids);

		return {message: "Caja guardada", data: newCaja};
	}
	// CREAR UN USUARIO ESTE COMANDO NO EXIGE ROL, SIN EMBARGO SE CREA OTRA FUNCION LLAMANDA callCreateUser QUE SI PEDIRA QUE TENGA PERMISOS PARA PODER CREAR UN USUARIO
	createUser(user, password, role){
		let data = this.start().data;

		let users = converterArray(data.simple.users);
		let searching = users.find(ch => ch.user == user);

		if(!searching){
			data.simple.id.users += 1;
			let users_object = data.simple.users;
			users_object[data.simple.id.users] = {
				user: user,
				password: password,
				role: role?role:"user",
				id: data.simple.id.users,
				token: sha256(`${user}+${new Date()}`).toString(),
				sha256: sha256(user).toString()
			};

			users_object[data.simple.id.users].logs = this.createLog('createUser', users_object[data.simple.id.users].id);

			this.db.setData('users', users_object);
			this.db.setData('id', data.simple.id);

			return {message: "Usuario creado satisfactoriamente.", data: users_object[data.simple.id.users]};
		}else {
			return {message: "Este nombre de usuario ya se encuentro usado.", type: "error"};
		}
	}

	// ELIMINAR UN USUARIO POR EL TOKEN
	deleteUser(token){
		let userFinding = this.getUserToken(token);
		if(!userFinding.data) return userFinding;

		let users = this.db.getData('users');
		users[userFinding.data.id] = undefined;
		this.db.setData('users', users);
		return {message: "Usuario eliminado satisfactoriamente", data: userFinding.data};
	}

	// EDITAR USUARIO

	editUser(id, data){
		let users = this.db.getData('users');
		let userFinding = users[id];
		if(!userFinding) return userFinding;

		users[userFinding.id].user = data.user;
		users[userFinding.id].password = data.password;
		users[userFinding.id].role = data.role;

		this.db.setData('users', users);
		return {message: "Usuario editado satisfactoriamente", data: users[userFinding.id]};
	}
	// OBTENER LA INFO DE UN USUARIO CON EL USUARIO Y LA CONTRASEÑA, ES MAS QUE TODO PARA EL LOGIN DE LA INTERFAZ
	getUser(user, password){
		let data = this.start().data.simple['users'];

		let users = converterArray(data);
		let searching = users.find(ch => ch.user == user);
		if(!searching) return {message: "Este nombre no de usuario no existe.", type: "error"};

		if(searching.password != password) return {message: "La contraseña es incorrecta.", type: "error"};

		return {message: "Usuario iniciado.", data: searching};
	}

	// INICIAR A TRAVEZ DEL TOKEN
	getUserToken(token){
		let data = this.start().data.simple['users'];
		let users = converterArray(data);
		let searching = users.find(ch => ch.token == token);
		if(!searching) return {message: "El token es invalido"};

		return {message: "Token iniciado", data: searching};
	}


	// ------------------------- PRODUCTOS --------------------------
	// CREAR UN PRODUCTO, SIN EMBARGO TIENE UNA LIMITACIÓN DE ROL.
	createProduct(data, token){
		let db_data = this.start();
		let data_db = db_data.data.simple['products'];
		let ids = db_data.data.simple['id'];

		ids.products = ids.products + 1;
		let final_data = {
			name: data.name,
			price: data.price,
			price_mayor: data.price_mayor,
			iva: data.iva?data.iva:"0",
			stock: data.stock?data.stock:Infinity,
			costo_adquisitivo: data.costo_adquisitivo?data.costo_adquisitivo:0,
			id_personalizado: data.id_personalizado,
			nanoid: generarToken(new Date()),
			fechaCreacion: new Date()-0,
			token: sha256(data.name).toString()
		};

		if(!data.name) return {message: "Agrega un nombre del producto"};

		let validateUser = this.validatePerms(token, 'productManager');
		if(!validateUser) return {message: "El usuario parece no tener permisos para crear un producto"};

		let products_array = converterArray(data_db);
		let findingProduct = products_array.find(ch => ch.name == data.name);
		
		if(findingProduct) return {message: "Ya hay un producto con el mismo nombre guardado."};

		final_data.id = data.id_personalizado?data.id_personalizado:ids.products;
		final_data.log = this.createLog('createProduct', final_data.token, token);
		data_db[data.id_personalizado?data.id_personalizado:ids.products] = final_data;

		this.db.setData('products', data_db);
		this.db.setData('id', ids);

		return {message: "Producto registrado satisfactoriamente", data: final_data};
	}

	editProduct(id, newInfo, token){
		let data_db = this.start();
		let products = data_db.data.simple['products'];
		let findingProduct = products[id];
		if(!findingProduct) return {message: "El producto no existe."};

		if(!newInfo) return {message: "Agrega la información de cambio para el producto."};
		let validateUser = this.validatePerms(token, 'productManager');
		if(!validateUser) return {message: "El usuario parece no tener permisos para crear un producto"};

		findingProduct.name = newInfo.name?newInfo.name:findingProduct.name;
		findingProduct.price = newInfo.price?newInfo.price:findingProduct.price;
		findingProduct.price_mayor = newInfo.price_mayor?newInfo.price_mayor:findingProduct.price_mayor;
		findingProduct.iva = newInfo.iva?newInfo.iva:findingProduct.iva;
		findingProduct.stock = newInfo.stock?newInfo.stock:findingProduct.stock;
		findingProduct.costo_adquisitivo = newInfo.costo_adquisitivo?newInfo.costo_adquisitivo:findingProduct.costo_adquisitivo;
		products[findingProduct.id] = findingProduct;
		findingProduct.ultimateDate = new Date()-0;
		findingProduct.log = this.createLog('editUser', findingProduct.token, token);

		this.db.setData('products', products);

		return {message: "Producto actualizado satisfactoriamente", data: products[findingProduct.id]};
	}

	deleteProduct(id, token){
		let data_db = this.start();
		let products = data_db.data.simple['products'];
		let findingProduct = products[id];
		if(!findingProduct) return {message: "El producto no existe."};

		let validateUser = this.validatePerms(token, 'productManager');
		if(!validateUser) return {message: "El usuario parece no tener permisos para eliminar un producto"};

		products[id] = undefined;

		this.db.setData('products', products);
		return {message: "Producto eliminado satisfactoriamente", data: {id: id}};
	}

	getProduct(id, token){
		let validateUser = this.validatePerms(token, 'view');
		if(!validateUser) return {message: "El usuario parece no tener permisos para ver los productos"};

		let data_db = this.start();
		let products = data_db.data.simple['products'];
		let findingProduct = products[id];
		if(!findingProduct) return {message: "Este id o producto esta registrado."};

		return {message: "Producto encontrado.", data: findingProduct};
	}
	getAllProducts(token){
		let validateUser = this.validatePerms(token, 'view');
		if(!validateUser) return {message: "El usuario parece no tener permisos para ver los productos"};

		let data_db = this.start();
		let products = data_db.data.simple['products'];

		return {message: "Listado de productos.", data: products};
	}

	// ROLES MANAGER
	createRole(data = {}, token){
		let validateUser = this.validatePerms(token, 'roleManager');
		if(!validateUser) return {message: "No tiene permisos suficientes."};

		let roles = this.db.getData('roles');
		let findingRole = roles[data.name];
		if(findingRole) return {message: "Este rol ya existe, usa otro nombre."};

		roles[data.name] = data.perms?data.perms:{view: true};

		this.db.setData('roles', roles);
		return {message: "Rol creado satisfactoriamente", data: roles[data.name]};
	}

	editRole(data = {}, token){
		let validateUser = this.validatePerms(token, 'roleManager');
		if(!validateUser) return {message: "No tiene permisos suficientes."};

		if(!data.name) return {message: "Este rol parece ser inexistente."};
		let roles = this.db.getData('roles');
		if(!roles[data.name]) return {message: "Este rol parece ser inexistente."};

		roles[data.name] = data.perms;

		this.db.setData('roles', roles);
		return {message: "Rol editado correctamente.", data: roles[data.name]};
	}
	deleteRole(name, token){
		let validateUser = this.validatePerms(token, 'roleManager');
		if(!validateUser) return {message: "No tiene permisos suficientes."};

		if(!name) return {message: "Este rol parece ser inexistente."};
		let roles = this.db.getData('roles');
		if(!roles[name]) return {message: "Este rol parece ser inexistente."};

		roles[name] = undefined;
		this.db.setData('roles', roles);

		return {message: `El rol ${name} ha sido eliminado satisfactoriamente.`, data: {name: name}};
	}

	// ------------------ ADMINISTRATION USERS -------------------------------
	adminCreateUser(data = {}, token){
		let validateUser = this.validatePerms(token, 'all');
		if(!validateUser) return {message: "No tiene permisos suficientes."};

		if(!data.user) return {message: "Ingresa el nombre del usuario."};
		if(!data.password) return {message: "Ingresa la contraseña del usuario"};
		if(!data.role) return {message: "Ingresa el nombre del rol que el usuario va a usar."};
		
		return this.createUser(data.user, data.password, data.role);
	}
	adminEditUser(data = {}, token){
		let validateUser = this.validatePerms(token, 'all');
		if(!validateUser) return {message: "No tiene permisos suficientes."};

		if(!data.user) return {message: "Ingresa el nombre del usuario."};
		if(!data.password) return {message: "Ingresa la contraseña del usuario"};
		if(!data.role) return {message: "Ingresa el nombre del rol que el usuario va a usar."};
		if(!data.id) return {message: "Agrega el id del usuario a modificar."};

		let user = this.getUserToken(token);

		if(user.data.id == data.id){
			data.role = user.data.role;
		}
		
		return this.editUser(data.id, data);
	}
	adminDeleteUser(token_user, token){
		let validateUser = this.validatePerms(token, 'all');

		if(!validateUser) return {message: "No tiene permisos suficientes."};

		if(token_user == token) return {message: "No te puedes eliminar a ti mismo."};

		let userFinding = this.getUserToken(token_user);
		if(!userFinding) return {message: "El token del usuario enviado no existe."};
		
		return this.deleteUser(token_user);
	};


	// VENTAS CONTROL
	createVenta(ventas = [], total_recibido = 0, token, mayor){
		if(!ventas[0]) return {"message": "Añade productos para concretar la venta."};

		let all_data = this.start().data.simple
		let products = all_data['products'];
		let vents = all_data['ventas'];
		let ids = all_data['id'];

		let final_data = [];
		let products_dont = [];
		let final_count = 0;
		ventas.forEach((element, i, array) => {
			let findingProduct = products[element.id];
			if(!findingProduct) return products_dont.push(element.id);
			let final_product = {};

			if(element.stock) element.stock = element.stock - eval(element.cantidad?element.cantidad:0);
			products[findingProduct.id] = findingProduct;
			this.db.setData('products', products);

			if(!mayor) {
				final_product = {
					id: element.id,
					precio_unitario: findingProduct.price?findingProduct.price:(element.price?element.price:0),
					cantidad: element.cantidad?element.cantidad:1
				}
			}else {
				final_product = {
					id: element.id,
					precio_unitario: findingProduct.price_mayor?findingProduct.price_mayor:(element.price?element.price:0),
					cantidad: element.cantidad?element.cantidad:1
				}
			}
			
			final_product.precio_final = final_product.precio_unitario * final_product.cantidad;

			final_data.push(final_product)			
			final_count = final_count + final_product.precio_final;
		})

		if(final_count > total_recibido) return {message: "El total recibido no puede ser menor al total pago."};

		ids.ventas = ids.ventas + 1;

		let final_venta = {
			products: final_data,
			productsNone: products_dont,
			recibido: total_recibido?total_recibido:final_count,
			total_pago: final_count,
			id: ids.ventas,
			date: new Date()-0,
			ventaHechaPor: token?token:"Cajero Común",
			mayor: mayor
		};
		final_venta.vueltas = final_venta.recibido - final_venta.total_pago;

		vents[ids.ventas] = final_venta;

		this.db.setData('ventas', vents);
		this.db.setData('id', ids);
		return {message: "Venta hecha satisfactoriamente", data: final_venta};
	}

	editVenta(data = {id: 0}, total_recibido){
		let all_data = this.db.start().data.simple;
		let ventas = all_data['ventas'];
		let ids = all_data['id'];


		let findingVenta = ventas[data.id];
		if(!findingVenta) return {message: "Esta venta no existe o no fue concretada"};
		ventas[findingVenta.id] = undefined;
		this.db.setData('ventas', ventas);

		return this.createVenta(data.ventas, total_recibido);
	}

	deleteVenta(id){
		let ventas = this.db.getData('ventas');
		let findingVenta = ventas[id];
		if(!findingVenta) return {message: "Esta venta no existe o no fue concretada."};
		
		let ultimateVenta = ventas[id];
		ventas[id] = undefined;

		this.db.setData('ventas', ventas);

		return {message: "Venta eliminada satisfactoriamente.", data: true, ventaEliminada: ultimateVenta};
	}

	getAllVentas(){
		let ventas = this.db.getData('ventas');

		return {message: "Lista de todas las ventas", data: ventas};
	}


	// CLIENTS MANAGER
	findClient(data = {}, token){
		if(!data) return {message: "Agrega la información del cliente"};

		let validateUser = this.validatePerms(token, 'view');
		if(!validateUser) return {message: "No tiene permisos suficientes."};

		let users = this.db.getData('clientes');
		let array_user = converterArray(users);

		return users[data.id] || array_user.find(ch => ch.name == data.name) || array_user.find(ch => ch.document == data.document);
	}
	createClient(data, token){
		if(!data) return {message: "Agrega la información del cliente"};

		let validateUser = this.validatePerms(token, 'clientManager');
		if(!validateUser) return {message: "No tiene permisos suficientes."};

		let findingClient = this.findClient(data, token);
		if(findingClient) return {message: "Este nombre, documento o id ya existe."};

		if(!data.name) return {message: "El nombre es obligatorio ponerlo."};

		let all_data = this.db.start().data.simple;
		let clients = all_data['clientes'];
		let ids = all_data['id'];

		ids.clientes = ids.clientes+1;

		let final_client = {
			name: data.name,
			type: data.type,
			document: data.document,
			phone: data.phone,
			correo: data.correo,
			date: new Date()-0,
			city: data.city,
			direccion: data.direccion,
			compras: [],
			id: ids.clientes
		}
		clients[ids.clientes] = final_client;

		this.db.setData('id', ids);
		this.db.setData('clientes', clients);

		return {message: "Cliente guardado satisfactoriamente", data: final_client};
	}

	editClient(data, token){
		if(!data) return {message: "Agrega la información del cliente"};

		let validateUser = this.validatePerms(token, 'clientManager');
		if(!validateUser) return {message: "No tiene permisos suficientes."};

		if(!data.id) return {message: "Agrega el id del cliente que quieres modificar."};

		let all_data = this.db.start().data.simple;
		let clients = all_data['clientes'];

		if(!clients[data.id]) return {message: "Este cliente no existe o ya fue eliminado."};

		clients[data.id].name = data.name;
		clients[data.id].document = data.document
		clients[data.id].phone = data.phone
		clients[data.id].correo = data.correo;
		clients[data.id].city = data.city
		clients[data.id].direccion = data.direccion;

		this.db.setData('clientes', clients);


		return {message: "Cliente editado satisfactoriamente", data: clients[data.id]};
	}

	deleteClient(id, token){
		if(!id) return {message: "Agrega la información del cliente"};

		let validateUser = this.validatePerms(token, 'clientManager');
		if(!validateUser) return {message: "No tiene permisos suficientes."};

		let all_data = this.db.start().data.simple;
		let clients = all_data['clientes'];

		if(!clients[id]) return {message: "Este cliente no existe o ya fue eliminado."};

		let clienteEliminado = clients[id];

		clients[id] = undefined;

		this.db.setData('clientes', clients);
		return {message: "Cliente eliminado satisfactoriamente", data: clienteEliminado};
	}

	getClients(data){
		let validateUser = this.validatePerms(data, 'view');
		if(!validateUser) return {message: "No tiene permisos suficientes."};
		let clientes = this.db.getData('clientes');
		return {message: "Lista de clientes", data: clientes};
	}

	// -------------------------- LOGS CREATOR -----------------------------------

	createLog(type, data, author){
		let data_db = this.logs.start();
		let db = this.logs;
		
		if(!db.getData('logs')) db.setData('logs', {});
		if(!db.getData('id')) db.setData('id', {logs: 0});

		let newData = this.logs.start();
		let logs = newData.data.simple['logs'];
		let ids = newData.data.simple['id'];

		ids.logs = ids.logs + 1;
		logs[ids.logs] = {
			date: new Date()-0,
			type: type?type:"none",
			id: ids.logs,
			data: data,
			author: author?author:"Sistema automatico de SIOPS"
		}


		db.setData('logs', logs);
		db.setData('ids', ids);

		return logs[ids.logs];
	}

	logsSetDay(data){

	}

	// ---------------------------- FUNCIONES DE VALIDACIÓN ---------------------------------

	// OBTENER PARAMETROS DE LOS ROLES
	getInfoPerms(role){
		let data = this.db.getData('roles');

		let findingRole = data[role];
		if(!findingRole) return null;

		return findingRole;
	}

	// VALIDAR SI TIENE EL PERMISO NECESARIO PARA LA ACCIÓN DESEADA
	validatePerms(token, perm){
		let user = this.getUserToken(token);
		if(!user.data) return null;

		let data_role = user.data.role;

		let perms = this.getInfoPerms(data_role);

		return perms[perm] || perms['all'];
	}
}

module.exports = Database;
module.exports.converterArray = converterArray;