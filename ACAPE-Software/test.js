const api_db = require('./APIS/database.js');
const database = new api_db({
  user: "acape",
  password: "admin"
})

database.createUser('keigocode', 'keigocode', 'owner')
let user = database.getUser('keigocode', 'keigocode').data

const new_product = database.createProduct({
	name: "server",
	price: 1000
}, user.token);

database.registrarCaja({date: new Date()}, user.token)

// console.log(database.editVenta({id: 9, ventas: [{id: 5, price: 10000}]}));
// console.log(database.db.getData('ventas'))