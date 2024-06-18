
// SERVICIOS
const socket = io('http://127.0.0.1:9000');
const router = new Router('ACAPE Software', {
  nameweb: "ACAPE Software",
  app: ".app",
  error_404: "<h1>Error, Pagina deshabilitada</h1>"
});
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

const alert = Swal.mixin({
  customClass: {
    popup: 'shadow',
    confirmButton: 'btn btn-outline-primary',
    cancelButton: 'btn btn-outline-danger'
  },
  confirmButtonText: "Aceptar",
  buttonsStyling: false
});


// SOCKETS ON LISTENER ------------------------------------------------------------
socket.on('token_validation', (data) => {
  if(!data.data){
    alert.close()
    popup.open({
      title: "Token Invalido",
      content: `
        <p>El token actual es invalido y no se puede seguir usando hasta que se pague la suscripción. Recuerda que puedes cancelar 2 o mas suscripciones al tiempo.</p>
        <button class="btn btn-outline-info" onclick="validTokenPopup()"><i class="fa-solid fa-square-plus"></i> Tengo otra suscripción</button>
      `,
      close: false
    })
    let validateButton = document.querySelector('.validate-button')?document.querySelector('.validate-button'):{};
    validateButton.innerHTML = "Validar";
    popup.setNotification('El token es invalido');
  }else {
    popup.start();
    alert.close()
    localStorage.setItem('acape-data-principal', JSON.stringify({token: data.data.token, timeRest: data.data.timeRest}));
  }
})



const popup = new alerter('.alerter');
popup.start()

function converterArray(object){
  let keys = Object.keys(object);
  let arrayToReturn = [];
  
  keys.forEach((element, i, array) => {
    arrayToReturn.push(object[element]);
  })

  return arrayToReturn;
}

// POPUP -----------------------------------------------------------------------------

function setSubmitCaja(e){
  localStorage.setItem('caja', JSON.stringify({
    value: eval(e[0].value), 
    ventas_hechas: [], 
    total_recibido: 0, 
    egresos: [], 
    ventas_eliminadas: [], 
    date: new Date()-0, 
    value_egresos: 0, 
    starting: eval(e[0].value),
    ingresos: [],
    ingreso: 0,
    egreso: 0
  }));

  popup.close();

  return false;
}

function registCaja(venta, total_recibido){
  let caja = localStorage.getItem('caja');
  if(!caja) setSubmitCaja([{value: 0}]);

  let data = JSON.parse(localStorage.getItem('caja'));
  data.value = data.value + eval(total_recibido);
  data.ventas_hechas.push(venta);
  data.total_recibido = eval(data.total_recibido) + eval(total_recibido);

  localStorage.setItem('caja', JSON.stringify(data));

  return data;
}

function registCajaMinus(venta, total_recibido){
  let caja = localStorage.getItem('caja');
  if(!caja) setSubmitCaja([{value: 0}]);

  let data = JSON.parse(localStorage.getItem('caja'));
  data.value = data.value - eval(total_recibido);

  data.value_egresos = eval(data.value_egresos) + eval(total_recibido);
  data.ventas_eliminadas.push(venta);

  localStorage.setItem('caja', JSON.stringify(data));

  return data;
}

function createIngreso(venta, total_recibido){
  let caja = localStorage.getItem('caja');
  if(!caja) setSubmitCaja([{value: 0}]);

  let data = JSON.parse(localStorage.getItem('caja'));
  data.value = data.value + eval(total_recibido);

  data.ingresos.push(venta);
  data.ingreso = eval(data.ingreso) + eval(total_recibido);

  localStorage.setItem('caja', JSON.stringify(data));

  return data;
}

function createEgreso(venta, total_recibido){
  let caja = localStorage.getItem('caja');
  if(!caja) setSubmitCaja([{value: 0}]);

  let data = JSON.parse(localStorage.getItem('caja'));
  data.value = data.value - eval(total_recibido);

  data.egreso = eval(data.egreso) + eval(total_recibido);
  data.egresos.push(venta);

  localStorage.setItem('caja', JSON.stringify(data));

  return data;
}

function sessionValidator(){
  let sesion = sessionStorage.getItem('acape-session');
  let caja = localStorage.getItem('caja');
  if(!caja){
    popup.open({
      title: "Caja",
      content: `
        <form onsubmit="return setSubmitCaja(this)">
          <label>Agrega el total que hay de dinero en caja</label>
          <input type="number" placeholder="60000" class="form-control" required>
          <br>
          <button class="btn btn-outline-primary">Aceptar</button>
        </form>
      `,
      close: false
    })
  }

  if(document.querySelector('.aplication')) return null;

  if(!sesion) return null;
  let data = sesion;
  socket.emit('session-validator', data);
  
  socket.once('session-validator', (data) => {
    if(!data.data) {
      Toast.fire({
        text: data.message,
        icon: "error"
      })
      sessionStorage.removeItem('acape-session');
      location.hash = "#/invalid-user";
    };
    Toast.fire({
      text: data.message,
      icon: data.type?data.type:"success"
    })
    
    document.querySelector('.menu').innerHTML = `
      <div class="aplication">
        <nav class="navigator">
        <br>
          <div class="logos text-center">
            <a href="#" class="navbar-brand-title">Acape</a>
            <p>Control de tu empresa</p>
          </div>
          <ul class="list-navbar">
            <li class="item-navbar">
              <a href="#/" class="active"><i class="fa-solid fa-house"></i> <span>Principal</span></a>
            </li>
            <li class="item-navbar">
              <a class="item-navbar toggle-navbar" onclick="toggleNavbar()"><i class="fa-solid fa-sliders"></i> Administración <span class="change-rotation"><span class="set-right">&#9660;</span></span></a>
              <ul class="dropdown-menu-personalizado">
                <li class="item-navbar"><a href="#/productos"><i class="fa-solid fa-shop"></i> Productos</a></li>
                <li class="item-navbar"><a href="#/clientes"><i class="fa-regular fa-user"></i> Clientes</a></li>
                <li class="item-navbar"><a href="#/ventas"><i class="fa-solid fa-dollar"></i> Ventas hechas</a></li>
                <li class="item-navbar"><a href="#/config"><i class="fa-solid fa-gear"></i> Configuraciones</a></li>
              </ul>
            </li>
            <li class="item-navbar"><a href="#/caja"><i class="fa-solid fa-coins"></i> Caja</a></li>
            <li class="item-navbar"><a href="#/facturero"><i class="fa-solid fa-file"></i> Facturero</a></li>
            <li class="item-navbar"><a href="#/user"><i class="fa-solid fa-user"></i> Usuario</a></li>
            <li class="item-navbar"><a href="#/metricas"><i class="fa-solid fa-money-bill-trend-up"></i> Seguimiento</a></li>
          </ul>
        </nav>
      </div>
      `
      ;
      document.querySelector('.app').classList.add('active')
  })
}

// FORMS SUBMITS ---------------------------------------------------------------------
function sendValidationToken(e){
  socket.emit('token_validation', e[0].value);

  let validateButton = document.querySelector('.validate-button');
  validateButton.innerHTML = `<div class="center-x"><div class="loader-validate-button"></div></div>`;

  return false;
}

function loginFunc(e){
  let data = {
    user: e[0].value,
    password: e[1].value
  }

  socket.emit('login-acape', data);

  return false;
}


// LISTENING SOCKETS -------------------------------------------------------------------

socket.on('message', (message) => {
  Toast.fire({
    text: message.message,
    icon: message.type?message.type:"success"
  })
})

socket.on('login-acape', (data) => {
  sessionStorage.setItem('acape-session', data.data.token);
  location.reload()
})

// ROUTER FUNCTIONS --------------------------------------------------

function setListProduct(data){
  let products = JSON.parse(sessionStorage.getItem('products'));

  let array_products = converterArray(products)
  let findingProduct = array_products.find(ch => ch.id == data);

  if(!findingProduct) return Toast.fire({
    title: "Manager de productos",
    text: "El producto no se encuentra registrado en el sistema o fue eliminado.",
    icon: "error"
  });

  document.querySelector('.reseting-listing').value = '';
  document.querySelector('.searching').innerHTML = '';

  let listing = sessionStorage.getItem('actually-list-products');
  if(!listing) sessionStorage.setItem('actually-list-products', JSON.stringify([]));

  let actuallyListing = listing?JSON.parse(listing):[];

  let findingProduct2 = actuallyListing.find(ch => ch.name == findingProduct.name);
  if(findingProduct2) {
    actuallyListing.forEach((element, i, array) => {
      if(element.name == findingProduct2.name){
        element.cantidad = element.cantidad?element.cantidad:0;
        element.cantidad = element.cantidad + 1;
        array[i] = element;
        sessionStorage.setItem('actually-list-products', JSON.stringify(array));
      }
    })
  }else {
    if(!findingProduct.price){
      findingProduct.cantidad = 1;
      alert.fire({
        title: "Precio",
        input: "number"
      }).then((element) => {
        if(element.isConfirmed){
          findingProduct.cantidad = null;
          findingProduct.price = element.value;
          actuallyListing.push(findingProduct);
          sessionStorage.setItem('actually-list-products', JSON.stringify(actuallyListing));
          listingProducts();
        }
      })
    }else {
      if(findingProduct.stock == null){
        findingProduct.cantidad = 1;
        actuallyListing.push(findingProduct);
        sessionStorage.setItem('actually-list-products', JSON.stringify(actuallyListing));
        listingProducts();
        return;
      }
      if(findingProduct.stock < 1) return Toast.fire({
        title: "Manager de productos",
        text: "Al parecer no hay cantidad de este producto.",
        icon: "error"
      });
      findingProduct.cantidad = 1;
      actuallyListing.push(findingProduct);
      sessionStorage.setItem('actually-list-products', JSON.stringify(actuallyListing));
    }
  }

  listingProducts();
}

function inputVentas(e){
  let actuallyProducts = JSON.parse(sessionStorage.getItem('products')?sessionStorage.getItem('products'):"{}");

  let array_products = converterArray(actuallyProducts);
  let filtering = array_products.filter(ch => {
    return ch.name.toLowerCase().includes(e.value.toLowerCase()) || ch.id.toString().includes(e.value.toLowerCase());
  });
  if(e.value == "") return document.querySelector('.searching').innerHTML = '';
  document.querySelector('.searching').innerHTML = `
    <div class="buscando">
      ${filtering.map(ch => `<div onclick="setListProduct('${ch.id}')" class="sill-btn">ID: ${ch.id} - ${ch.name} - Precio: ${ch.price}</div>`).join('')}
    </div>
  `;
}

function deleteList(id){
  let actuallyProductsList = sessionStorage.getItem('actually-list-products');
  if(!actuallyProductsList) return;

  let productList = JSON.parse(actuallyProductsList);

  productList.forEach((element, i, array) => {
    if(element.id == id){
      array.splice(i, 1);
      sessionStorage.setItem('actually-list-products', JSON.stringify(array));
    }
  })

  listingProducts();
}

function changeCantidad(id, e){
  let actuallyProductsList = sessionStorage.getItem('actually-list-products');
  if(!actuallyProductsList) return;

  let productList = JSON.parse(actuallyProductsList);
  let finalPrice = 0;
  productList.forEach((element, i, array) => {
    if(element.id == id){
      if(!array[i].stock) {
        array[i].cantidad = e.value?e.value:1;
        finalPrice = eval(finalPrice) + eval(element.cantidad?(element.price*array[i].cantidad):element.price);
        sessionStorage.setItem('actually-list-products', JSON.stringify(array));
        document.querySelector(`.change-price-${id}`).innerHTML = `${array[i].price*array[i].cantidad}`;
        document.querySelector('.edit-total').innerHTML = finalPrice;
        return;
      }
      if(array[i].stock < eval(e.value)) return Toast.fire({
        title: "Manager de productos",
        text: "No hay stock suficiente para la cantidad deseada.",
        icon: "error"
      });

      array[i].cantidad = e.value?e.value:1;
      finalPrice = eval(finalPrice) + eval(element.cantidad?(element.price*array[i].cantidad):element.price);
      sessionStorage.setItem('actually-list-products', JSON.stringify(array));
      document.querySelector(`.change-price-${id}`).innerHTML = `${array[i].price*array[i].cantidad}`;
      document.querySelector('.edit-total').innerHTML = finalPrice;
    }else {
      finalPrice = eval(finalPrice) + eval(element.cantidad?(element.price*element.cantidad):element.price);
    }
  });

  return false;
}

function listingProducts(){
  let actuallyProductsList = sessionStorage.getItem('actually-list-products')?JSON.parse(sessionStorage.getItem('actually-list-products')):[];

  let array_productsList = actuallyProductsList;
  // xd
  let finalPrice = 0;
  let final_html = array_productsList.map(ch => {
    finalPrice = eval(finalPrice) + eval(ch.cantidad?(ch.price*(ch.cantidad?ch.cantidad:0)):ch.price);
    return `<tr>
        <td>${ch.id}</td>
        <td>${ch.name}</td>
        <td>${formatNumber(ch.price)}</td>
        <td class="non-padding">
          <input oninput="return changeCantidad('${ch.id}', this)" type="number" value="${ch.cantidad?ch.cantidad:1}" ${!ch.cantidad?"disabled":""}>
        </td>
        <td class="change-price-${ch.id}">${formatNumber(ch.cantidad?(ch.price*(ch.cantidad?ch.cantidad:0)):ch.price)}</td>
        <td class="text-center cursor-pointer" onclick="deleteList('${ch.id}')">x</td>
      </tr>`
  }).join('')

  if(document.querySelector('.tbody-products')){
    document.querySelector('.tbody-products').innerHTML = `
    ${final_html}
  `;
  }

  document.querySelector('.edit-total').innerHTML = `$ ${formatNumber(finalPrice)}`;
}

function sendCreateVenta(e, mayor, finalPrice){
  let actuallyList = JSON.parse(sessionStorage.getItem('actually-list-products'));
  let token = sessionStorage.getItem('acape-session');
  let data = {
    venta: actuallyList,
    total_recibido: e[0].value,
    token: token,
    mayor: mayor
  };
  socket.emit('createVenta', data);

  popup.open({
    title: "Venta hecha",
    content: `Total a pagar: ${finalPrice} <br> Total Recibido: ${data.total_recibido} <br><br> Vueltos: ${eval(e[0].value) - finalPrice} <br><br> <button class="btn btn-outline-info" onclick="popup.close()">Aceptar</button>`
  });

  return false;
}

function facturacion(){
  let actuallyList = sessionStorage.getItem('actually-list-products');
  if(!actuallyList) return Toast.fire({
    title: "Manager de venta",
    text: "Actualmente no hay nada para vender"
  });

  let finalList = JSON.parse(actuallyList);

  let finalPrice = 0;

  let finalProducts = finalList.map(ch => {
    finalPrice = eval(finalPrice) + eval(ch.cantidad?(ch.price * ch.cantidad):ch.price);

    return `<hr> <div class="product bt-1">ID: ${ch.id} | ${ch.name} | Cantidad: ${ch.cantidad?ch.cantidad:1} | Precio Unitario: ${formatNumber(ch.price)} | Precio Final: ${formatNumber(ch.cantidad?(ch.price * ch.cantidad):ch.price)}</div>`;
  }).join('')
  popup.open({
    title: "Venta Normal",
    content: `
      <form onsubmit="return sendCreateVenta(this, null, ${finalPrice})">
        <label>Total Recibido</label>
        <input type="number" class="form-control" value="${finalPrice}">
        <div class="actual-venta">
          ${finalProducts}
          <hr>
        </div>
        <br>
        <div class="precio-final"><h5>Total a pagar: $ ${formatNumber(finalPrice)}</h5></div>
        <br>
        <button class="btn btn-outline-primary"><i class="fa-solid fa-floppy-disk"></i> Finalizar</button>
      </form>
    `
  })
}

function facturacionMayor(){
  let actuallyList = sessionStorage.getItem('actually-list-products');
  if(!actuallyList) return Toast.fire({
    title: "Manager de venta",
    text: "Actualmente no hay nada para vender"
  });

  let finalList = JSON.parse(actuallyList);

  let finalPrice = 0;

  let finalProducts = finalList.map(ch => {
    finalPrice = eval(finalPrice) + eval(ch.cantidad?((ch.price_mayor?ch.price_mayor:ch.price) * ch.cantidad):(ch.price_mayor?ch.price_mayor:ch.price));

    return `<hr> <div class="product bt-1">ID: ${ch.id} | ${ch.name} | Cantidad: ${ch.cantidad?ch.cantidad:1} | Precio Unitario: ${formatNumber(ch.price_mayor?ch.price_mayor:ch.price + ' (Este producto no tiene precio por mayor)')} | Precio Final: ${formatNumber(eval(ch.cantidad?((ch.price_mayor?ch.price_mayor:ch.price) * ch.cantidad):(ch.price_mayor?ch.price_mayor:ch.price)))}</div>`;
  }).join('')
  popup.open({
    title: "Venta Por Mayor",
    content: `
      <form onsubmit="return sendCreateVenta(this, true, ${finalPrice})">
        <label>Total Recibido</label>
        <input type="number" class="form-control" value="${finalPrice}">
        <div class="actual-venta">
          ${finalProducts}
          <hr>
        </div>
        <br><br>
        <div class="precio-final"><h5>Total a pagar: $ ${formatNumber(finalPrice)}</h5></div>

        <button class="btn btn-outline-primary"><i class="fa-solid fa-floppy-disk"></i> Finalizar</button>
      </form>
    `
  })
}

function createSpace(){
  socket.emit('createSpace', {message: "Abrir otro espacio"})
}

function borrarLista(){
  sessionStorage.removeItem('actually-list-products');
  listingProducts();
}

window.addEventListener('keydown', (data) => {
  if(data.ctrlKey && event.key == "f"){
    facturacion()
  }else if(data.ctrlKey && event.key == "d"){
    facturacionMayor();
  }else if(data.ctrlKey && event.key == "p"){
    facturaHoja()
  }else if(data.ctrlKey && data.shiftKey && event.key == "o"){
    localStorage.clear();
    sessionStorage.clear();
    location.reload()
  }
})


// Utilizamos delegación de eventos en un elemento padre que siempre esté presente en el DOM
document.addEventListener('submit', function(event) {
  if (event.target && event.target.matches('.productListening')) {
    event.preventDefault(); // Evitamos que el formulario se envíe
    submitProduct(event.target)
  }
});


function submitProduct(e){
  let actuallyProducts = JSON.parse(sessionStorage.getItem('products')?sessionStorage.getItem('products'):"{}");

  let array_products = converterArray(actuallyProducts);

  let filtering = array_products.filter(ch => {
    return ch.name.toLowerCase().includes(e[0].value.toLowerCase()) || ch.id.toString().includes(e[0].value.toLowerCase());
  });

  let final_product = filtering[0];

  if(!final_product) return alert.fire({
    title: "Producto No Registrado",
    icon: "info",
    confirmButtonText: "Aceptar"
  });


  setListProduct(final_product.id)
}

router.get(['/', '', '/app'], () => {
  const sesion = sessionStorage.getItem('acape-session');
  if(!sesion){
    return `
      <div class="center-center center-full">
        <form class="siops-sesion card p-5" onsubmit="loginFunc(this)">
          <h3 class="text-center">ACAPE</h3>
          <p>Aplicación Contable Administrativa Para Empresas</p>
          <label htmlFor="user">Usuario</label>
          <input type="text" id="user" class="form-control" placeholder="Usuario">
          <br>
          <label htmlFor="password">Contraseña</label>
          <input type="password" placeholder="Contraseña" class="form-control">
          <br>
          <button class="btn btn-outline-primary btn-block d-block w-100">Iniciar</button>
          <br>
        </form>
      </div>
    `;
  }else {
    sessionValidator()

    socket.emit('getAllProducts', sesion);
    socket.once('getAllProducts', (data) => {
      sessionStorage.setItem('products', JSON.stringify(data.data));
      listingProducts()
    })

    return `<div class="container"><br><br>
      <h1 class="text-center">Facturación</h1>
      <p class="text-center">Creación de ventas.</p>
      <button class="btn btn-outline-primary" onclick="facturacion()"><i class="fa-solid fa-money-bill"></i> Factura Normal</button>
      <button class="btn btn-outline-secondary" onclick="facturacionMayor()"><i class="fa-solid fa-money-bills"></i> Factura Por Mayor</button>
      <button class="btn btn-outline-danger" onclick="borrarLista()"><i class="fa-solid fa-trash"></i> Borrar lista</button>
      <br><br>
      <button class="btn btn-outline-success" onclick="createSpace()"><i class="fa-solid fa-plus"></i> Nuevo Espacio</button>

      <br>
      <br>
      <form class="productListening">
        <div class="input-group mb-3">
          <input type="text" class="form-control reseting-listing" oninput="inputVentas(this)" placeholder="12, Nombre Producto">
          <button class="btn btn-outline-secondary" type="button" id="button-addon2"><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
      </form>
      <div class="setting-data">
        <div class="searching"></div>
        <br>
        <div class="table-ventas">
          <table class="table-products">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Precio Final</th>
                <th>Eliminar</th>
              </tr>
            </thead>
            <tbody class="tbody-products">
              
            </tbody>
          </table>
          <br>
          <h3>Total: <span class="edit-total">0</span></h3>
        </div>
      </div>
    </div>`;
  }
});

router.get('/invalid-user', () => {
  setTimeout(() => {
    location.hash = "#/"
  }, 2000)
  return `<div class="center-center center-full">La sesion de usuario es invalida</div>`;
})

function deleteProducts(id){
  let token = sessionStorage.getItem('acape-session');
  alert.fire({
    title: "Eliminar Producto",
    text: `Estas seguro de que querer eliminar el producto: ${id}`,
    icon: "info",
    confirmButtonText: "Aceptar",
    showCancelButton: true,
    cancelButtonText: "Cancelar"
  }).then((result) => {
    if(result.isConfirmed) {
      socket.emit('deleteProduct', {product: id, token: token});
    }
  })
}

function sendEditProduct(e, id){
  let data = {
    name: e[0].value,
    price: e[1].value,
    price_mayor: e[2].value,
    iva: e[3].value,
    stock: e[4].value,
    costo_adquisitivo: e[5].value,
    id_personalizado: e[6].value,
    id: id
  }

  let token = sessionStorage.getItem('acape-session')
  socket.emit('editProduct', {product: data, token: token});

  return false;
}

// EDITANDO PRODUCTOS
function editProduct(id){
  let token = sessionStorage.getItem('acape-session')
  socket.emit('getProductsScan', token);
  socket.on('getProductsScan', (data) => {
    socket.off('getProductsScan')
    if(!data.data) {
      return Toast.fire({
        title: "Manager de productos",
        text: data.message,
        icon: "error"
      });
    }
    let info_inputs = data.data[id];
    if(!info_inputs) return Toast.fire({
      title: "Manager de productos",
      text: "El producto que quieres editar no existe o fue eliminado.",
      icon: "error"
    });

    popup.open({
      title: "Ver o editar producto",
      content: `
        <form onsubmit="return sendEditProduct(this, '${id}')">
          <p>Aqui la info del producto</p>
          <label>Nombre del producto: </label>
          <input type="text" required placeholder="Producto x und" value="${info_inputs.name}" class="form-control">

          <label>Precio por unidad (opcional): </label>
          <p>Si no agregas precio, cada vez que vayas a vender este producto se te pedira un precio.</p>
          <div class="input-group mb-3">
            <span class="input-group-text" id="basic-addon1">$</span>
            <input type="number" class="form-control" value="${info_inputs.price}" placeholder="1000">
          </div>

          <label htmlFor="">Precio por mayor o por descuento (opcional)</label>
          <div class="input-group mb-3">
            <span class="input-group-text" id="basic-addon1">$</span>
            <input type="number" class="form-control" value="${info_inputs.price_mayor}" placeholder="700">
          </div>

          <label class="d-inline">IVA (opcional)</label>
          <div class="input-group mb-3">
            <span class="input-group-text">%</span>
            <input type="number" class="form-control d-inline" value="${info_inputs.iva}" placeholder="1 - 100" max="100" min="0">
          </div>

          <label class="d-inline">Cantidad (opcional)</label>
          <p>Si no se pone cantidad, el stock sera infinito hasta que se cambie.</p>
          <div class="input-group mb-3">
            <span class="input-group-text">#</span>
            <input type="number" value="${info_inputs.stock}" class="form-control d-inline" placeholder="10">
          </div>

          <label htmlFor="">Costo Adquisitivo o precio original (opcional)</label>
          <p>Este precio no se vera a la hora de venderlo</p>
          <div class="input-group mb-3">
            <span class="input-group-text">$</span>
            <input type="number" class="form-control" value="${info_inputs.costo_adquisitivo}">
          </div>

          <label>ID Personalizado (opcional)</label>
          <div class="input-group mb-3">
            <span class="input-group-text">#</span>
            <input type="number" class="form-control value="${info_inputs.id_personalizado}" d-inline" placeholder="00318293"">
          </div>
          <br>
          <div class="edit-buttons">
            <button class="btn btn-outline-primary w-100"><i class="fa-solid fa-pen"></i> Editar</button>
            <a class="btn btn-outline-danger w-100" onclick="deleteProducts('${info_inputs.id}')"><i class="fa-solid fa-circle-minus"></i> Eliminar</a>
          </div>
        </form>
      `
    })
  })
}

function getProducts(){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('getAllProducts', token);

  socket.once('getAllProducts', (data) => {
    if(!data.data) return Toast.fire({text: data.message});

    let final_products = converterArray(data.data);

    sessionStorage.setItem('products', JSON.stringify(data.data))

    finalDetergente(final_products)
  })
}

function sendCreateProduct(e){
  let data = {
    name: e[0].value,
    price: e[1].value,
    price_mayor: e[2].value,
    iva: e[3].value,
    stock: e[4].value,
    costo_adquisitivo: e[5].value,
    id_personalizado: e[6].value
  }
  let token = sessionStorage.getItem('acape-session');

  socket.emit('createProduct', {product: data, token: token})
  return false;
}

function createProduct(){
  popup.open({
    title: "Crear producto",
    content: `
      <form class="create-product-form" onsubmit="return sendCreateProduct(this)">
        <p>Agrega la información del producto.</p>
        <label>Nombre del producto: </label>
        <input type="text" required placeholder="Producto x und" class="form-control">

        <label>Precio por unidad (opcional): </label>
        <p>Si no agregas precio, cada vez que vayas a vender este producto se te pedira un precio.</p>
        <div class="input-group mb-3">
          <span class="input-group-text" id="basic-addon1">$</span>
          <input type="number" class="form-control" placeholder="1000">
        </div>

        <label htmlFor="">Precio por mayor o por descuento (opcional)</label>
        <div class="input-group mb-3">
          <span class="input-group-text" id="basic-addon1">$</span>
          <input type="number" class="form-control" placeholder="700">
        </div>

        <label class="d-inline">IVA (opcional)</label>
        <div class="input-group mb-3">
          <span class="input-group-text">%</span>
          <input type="number" class="form-control d-inline" placeholder="1 - 100" max="100" min="0">
        </div>

        <label class="d-inline">Cantidad (opcional)</label>
        <p>Si no se pone cantidad, el stock sera infinito hasta que se cambie.</p>
        <div class="input-group mb-3">
          <span class="input-group-text">#</span>
          <input type="number" class="form-control d-inline" placeholder="10">
        </div>

        <label htmlFor="">Costo Adquisitivo o precio original (opcional)</label>
        <p>Este precio no se vera a la hora de venderlo</p>
        <div class="input-group mb-3">
          <span class="input-group-text">$</span>
          <input type="number" class="form-control">
        </div>

        <label>ID Personalizado (opcional)</label>
        <div class="input-group mb-3">
          <span class="input-group-text">#</span>
          <input type="number" class="form-control d-inline" placeholder="00318293"">
        </div>
        <br>
        <button class="btn btn-outline-primary d-block w-100">Crear Producto</button>
      </form>
    `
  })
}

function getList(func){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('getProductsScan', token);
  socket.on('getProductsScan', (data) => {
    socket.off('getProductsScan');

    func(data);
  })
}

function finalDetergente(data){
  let final_detergente = document.querySelector('.all-products');
  if(!final_detergente) return;
  let total_inversion = 0;
  let total_venta = 0;

  let final_products = data;

  final_detergente.innerHTML = `<table class="table-products">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th>IVA</th>
          <th>Cantidad</th>
          <th>Costo</th>
          <th>Editar</th>
        </tr>
      </thead>
      <tbody class="tbody-products">
        ${final_products.map(ch => {
          let actual_stock = ch.stock;
          total_inversion = eval(total_inversion) + eval(eval(ch.costo_adquisitivo?ch.costo_adquisitivo:eval(ch.precio?ch.precio:0)) * eval(ch.stock?ch.stock:0));
          total_venta = eval(total_venta) + (eval(ch.price?ch.price:0) * eval(ch.stock?ch.stock:0));

          return `<tr>
            <td># ${ch.id}</td>
            <td>${ch.name}</td>
            <td>Precio Normal: $ ${formatNumber(ch.price?ch.price:0)} <br> <span>Por Mayor: </span> $ ${formatNumber(ch.price_mayor?ch.price_mayor:0)}</td>
            <td>${ch.iva?ch.iva:0} %</td>
            <td># ${actual_stock==null?'Infinito':actual_stock}</td>
            <td>$ ${formatNumber(ch.costo_adquisitivo?ch.costo_adquisitivo:"0")}</td>
            <td><button class="btn btn-outline-success" onclick="editProduct('${ch.id}')"><i class="fa-solid fa-pen"></i></button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <br><br>
    <h5>Total Adquisición: $ ${formatNumber(total_inversion)}</h5>
    <h5>Total de venta: $ ${formatNumber(total_venta)}</h5>
    <hr>
    <h5>Total ganancias: ${formatNumber(total_venta - total_inversion)}</h5>`
}

function inputProducts(e){
  let actuallyProducts = JSON.parse(sessionStorage.getItem('products')?sessionStorage.getItem('products'):"{}");

  let array_products = converterArray(actuallyProducts);
  let filtering = array_products.filter(ch => {
    return ch.name.toLowerCase().includes(e.value.toLowerCase()) || ch.id.toString().includes(e.value.toLowerCase());
  });

  finalDetergente(filtering)
}

router.get(['/productos'], () => {
  sessionValidator();

  getProducts();

  return `<div class="container-fluid my-2">
    <h1 class="text-center">Productos</h1>
    <p class="text-center">La sección de productos, todas sus funciones necesitan permisos de dueño para poder agregar o quitar.</p>
    <div class="menu-products text-center w-100">
      <button class="btn btn-outline-primary" onclick="createProduct(this.value)"><i class="fa-solid fa-square-plus"></i> Agregar Producto</button>
    </div>
    <br>
    <form class="form-searching">
      <div class="input-group mb-3">
        <input type="text" class="form-control" oninput="inputProducts(this)" placeholder="12, Nombre Producto">
        <button class="btn btn-outline-secondary" type="button" id="button-addon2"><i class="fa-solid fa-magnifying-glass"></i></button>
      </div>
      <div class="searching"></div>
    </form>
    <br>
    <div class="all-products"></div>
  </div>`;
})

function eliminarVenta(id){
  alert.fire({
    title: "Eliminar venta",
    text: `Estas seguro de querer eliminar la venta: # ${id}`,
    confirmButtonText: "Aceptar",
    showCancelButton: true,
    cancelButtonText: "Cancelar"
  }).then((element) => {
    if(element.isConfirmed){
      socket.emit('deleteVenta', {venta: id});
      listingVentas()
    }
  })
}

function prepareToEdit(id){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('getAllVentas', token);

  socket.once('getAllVentas', (data) => {
    let productID = data.data[id];
    let final_products = productID.products;
    let products_list = [];
    socket.emit('getAllProducts', token);
    socket.once('getAllProducts', (data) => {
      final_products.forEach((element, i, array) => {
        if(data.data[element.id]){
          data.data[element.id].precio_final = element.precio_final;
          data.data[element.id].price = element.precio_unitario==element.precio_final?element.precio_final:element.precio_unitario;
          data.data[element.id].cantidad = element.cantidad;
          products_list.push(data.data[element.id]);
        }
      })

      sessionStorage.setItem('actually-list-products', JSON.stringify(products_list))
    })
    popup.close();
    location.hash = "#/"
    socket.emit('deleteVentaEdit', {token: token, venta: id});;
  })

  return false;
}

function editarVenta(id, products){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('getAllVentas', token)
  socket.once('getAllVentas', (data) => {
    console.log(data.data[id])
    let maping_products = data.data[id].products.map(ch => `
      <div>
        <span><b>ID: </b> ${ch.id} | <b>Precio Unitario: </b>${formatNumber(ch.precio_unitario)} | <b>Cantidad: </b> ${ch.cantidad}</span>
        <span><b>Precio Final: ${formatNumber(ch.precio_final)}</b></span>
      </div>
    `).join('hr');
    popup.open({
      title: "Editar venta",
      content: `<form onsubmit="return prepareToEdit('${id}')">
        <p>Estas seguro de querer editar esta venta. Esta venta sera eliminada y reemplazada con un nuevo id.</p>
        <hr>
        ${maping_products}
        <br>
        <button class="btn btn-outline-info">Aceptar</button>
      </form>`
    })  
  })
}

function listingVentas(){
  socket.emit('getAllVentas', {message: "Getting all ventas"});

  socket.once('getAllVentas', (data) => {
    let all_ventas = data.data;
    let ventas_array = converterArray(all_ventas).reverse();
    document.querySelector('.tbody-ventas').innerHTML = ventas_array.map(ch => `
      <tr>
        <td>${ch.id}</td>
        <td>${ch.products.length} -> ${ch.mayor?"Por mayor":"Normal"}</td>
        <td>${formatNumber(ch.total_pago)} $</td>
        <td>${formatNumber(ch.recibido)} $</td>
        <td>${formatNumber(ch.recibido - ch.total_pago)} $</td>
        <td>Hace ${getTimeLong((new Date()-0) - ch.date)}</td>
        <td>
          <button class="btn btn-outline-info" onclick="editarVenta('${ch.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-outline-danger" onclick="eliminarVenta('${ch.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('')
  })
}

router.get(['/ventas'], () => {
  sessionValidator()

  listingVentas()

  return `
    <div class="container-fluid my-2">
      <h1 class="text-center">Ventas Hechas</h1>
      <p class="text-center">Todas las ventas hechas y registradas en el sistema</p>
      <div class="ventas-hechas">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Productos</th>
              <th>T. Pago</th>
              <th>T. Recibo</th>
              <th>Vuelto</th>
              <th>Tiempo</th>
              <th>Opc</th>
            </tr> 
          </thead>
          <tbody class="tbody-ventas"></tbody>
        </table>
        <div class="total-ganado"></div>
      </div>
    </div>
  `;
})

function submitIngreso(e){
  let data = {
    money: e[0].value,
    description: e[1].value,
    date: new Date()
  }

  createIngreso(data, data.money);

  Toast.fire({
    title: "Ingresos",
    text: `Se acaban de ingresar $ ${e[0].value} al sistema.`,
    icon: "info"
  })

  popup.close();

  document.querySelector('.app').innerHTML = reloadCaja();
  
  return false;
}

function submitEgreso(e){
  let data = {
    money: e[0].value,
    description: e[1].value,
    date: new Date()
  }

  createEgreso(data, data.money);

  Toast.fire({
    title: "Egresos",
    text: `Se acaban de egresar $ ${e[0].value} al sistema.`,
    icon: "info"
  })

  document.querySelector('.app').innerHTML = reloadCaja();
  popup.close();

  return false;
}

function openWindowIngreso(){
  popup.open({
    title: "Agregar Ingreso",
    content: `
      <form class="form-ingreso" onsubmit="return submitIngreso(this)">
        <label htmlFor="">Total del ingreso</label>
        <div class="input-group mb-3">
          <span class="input-group-text">$</span>
          <input type="number" required class="form-control d-inline" placeholder="10000">
        </div>
        <label>Descripción (Opcional)</label>
        <textarea class="form-control" placeholder="Ejem: Pago de deuda de un cliente..."></textarea>
        <br>
        <button class="btn btn-outline-primary d-block w-100">Guardar Ingreso</button>
      </form>
    `
  })
}

function openWindowEgreso(){
  popup.open({
    title: "Agregar Egreso",
    content: `
      <form class="form-egreso" onsubmit="submitEgreso(this)">
        <label>Total del egreso</label>
        <div class="input-group mb-3">
          <span class="input-group-text">$</span>
          <input type="number" required class="form-control d-inline" placeholder="10000">
        </div>
        <label>Descripción (opcional)</label>
        <textarea class="form-control" placeholder="Ejem: Compra de articulos para uso diario..."></textarea>
        <br>
        <button class="btn btn-outline-danger">Guardar Egreso</button>
      </form>
    `
  })
}

function deleteIngreso(date){
  let caja = JSON.parse(localStorage.getItem('caja'));
  let ingresos = caja.ingresos;

  ingresos.forEach((element, i, array) => {
    if(date == element.date){
      caja.ingreso = eval(caja.ingreso) - eval(element.money);
      caja.value = caja.value - eval(element.money);
      array.splice(i, 1);
      caja.ingresos = array;
      localStorage.setItem('caja', JSON.stringify(caja));
      listIngresosEgresos();
      Toast.fire({
        text: "Ingreso eliminado satisfactoriamente.",
        icon: "success"
      });

    }
  })
}

function deleteEgreso(date){
  let caja = JSON.parse(localStorage.getItem('caja'));
  let egresos = caja.egresos;

  egresos.forEach((element, i, array) => {
    if(date == element.date){
      caja.egreso = eval(caja.egreso) - eval(element.money);
      caja.value = caja.value + eval(element.money);
      array.splice(i, 1);
      caja.egresos = array;
      localStorage.setItem('caja', JSON.stringify(caja));
      listIngresosEgresos();
      Toast.fire({
        text: "Ingreso eliminado satisfactoriamente.",
        icon: "success"
      });

    }
  })
}

function listIngresosEgresos(){
  let caja = JSON.parse(localStorage.getItem('caja'));
  popup.open({
    title: "Lista de ingresos y egresos",
    content: `
      <div>
        <div class="list-ingresos-egresos">
          <h4>Ingresos del dia.</h4>
          ${caja.ingresos.map(ch => `
            <div class="card">
              <div class="card-body">
                <span>${new Date(ch.date).toLocaleString()} - Hace ${getTimeLong(new Date()-new Date(ch.date))}</span>
                <span>Descripción: ${ch.description?ch.description:"Sin descripción"}</span>
                <span>Valor de: ${ch.money} $</span>
                <button class="btn btn-outline-danger d-inline-block" onclick="deleteIngreso('${ch.date}')"><i class="fa-solid fa-trash"></i> Eliminar</button>
              </div>
            </div>
          `).join('')}
          <hr>
          <h4>Egresos del dia</h4>
          ${caja.egresos.map(ch => `
            <div class="card">
              <div class="card-body">
                <span>${new Date(ch.date).toLocaleString()} - Hace ${getTimeLong(new Date()-new Date(ch.date))}</span>
                <span>Descripción: ${ch.description?ch.description:"Sin descripción"}</span>
                <span>Valor de: ${ch.money} $</span>
                <button class="btn btn-outline-danger d-inline-block" onclick="deleteEgreso('${ch.date}')"><i class="fa-solid fa-trash"></i> Eliminar</button>
              </div>
            </div>
          `)}
        </div>
      </div>
    `
  })
}

function sendCerrarCaja(){
  let caja = JSON.parse(localStorage.getItem('caja'));
  let token = sessionStorage.getItem('acape-session');

  socket.emit('registrarCaja', {caja: caja, token: token});

  socket.once('caja-manager', (data) => {
    localStorage.removeItem('caja');
    alert.fire({
      title: "Caja registrada",
      text: "La caja fue registrada satisfactoriamente",
      icon: "success"
    })

    popup.start();
    location.hash = "#/"
  })
}

function cerrarCaja(){
  let caja = JSON.parse(localStorage.getItem('caja'));

  popup.open({
    title: "Cerrar caja",
    content: `
      <div class="serve-continue">
        <p><b>Total dinero ingresado: </b> ${formatNumber(caja.total_recibido + caja.ingreso)}</p>
        <p><b>Total dinero egresado: </b> ${formatNumber(caja.value_egresos + caja.egreso)}</p>
        <hr>
        <p>Dinero total: ${formatNumber(caja.value)}</p>
        <hr>
        <button class="btn btn-outline-success" onclick="sendCerrarCaja()">Cerrar Caja <i class="fa-solid fa-x"></i></button>
      </div>
    `
  })
}

function guardarNuevaCaja(id){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('reabrirCaja', token);
  socket.once('reabrirCaja', (data) => {
    if(!data) return Toast.fire({
      text: "No tienes permisos suficientes",
      icon: "error"
    });

    let finding_caja = data[id];
    if(!finding_caja) return Toast.fire({
      text: "Parece que esta caja ya no existe.",
      icon: "error"
    });

    localStorage.setItem('caja', JSON.stringify(finding_caja));

    popup.start();
    location.hash = "#/"
  })
}

function reabrirCaja(){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('reabrirCaja', token);
  socket.once('reabrirCaja', (data) => {
    if(!data) return Toast.fire({
      text: "No tienes permisos suficientes",
      icon: "error"
    });

    let array_cajas = converterArray(data);

    popup.open({
      title: "Cajas registradas",
      content: `
        <div class="cajas-registradas">
          ${array_cajas.map(ch => `
            <div class="card">
              <div class="card-body">
                <span><b>ID: </b> ${ch.id} - Cerrada hace ${getTimeLong(new Date() - new Date(ch.cerrada))}</span><br>
                <span>Valor de la caja: ${formatNumber(ch.value)}</span><br><br>
                <button class="btn btn-outline-primary" onclick="guardarNuevaCaja('${ch.id}')"><i class="fa-regular fa-folder-open"></i> Reabrir</button>
              </div>
            </div>
          `).join('<br>')}
        </div>
      `
    })
  })
}

function reloadCaja(){
  let caja = JSON.parse(localStorage.getItem('caja'));
  sessionValidator();

  return `
    <div class="container-fluid my-2">
      <h1 class="text-center">Administración de caja</h1>
      <p class="text-center">En esta sección abra todos los movimientos hechos en la caja.</p>
      <hr>
      <div class="center-x">
        <button class="btn btn-outline-success mr-2" onclick="openWindowIngreso()"><i class="fa-solid fa-up-long"></i> Ingreso</button>
        <button class="btn btn-outline-danger" onclick="openWindowEgreso()"><i class="fa-solid fa-down-long"></i> Egreso</button>
        <button class="btn btn-outline-info" onclick="listIngresosEgresos()"><i class="fa-solid fa-up-down"></i> Lista de ingresos y egresos</button>
      </div>
      <br>
      <p><b>Valor inicial de la caja</b>: $ ${formatNumber(caja.starting)} | <b>La caja fue iniciada hace:</b> ${getTimeLong(new Date() - caja.date)}</p>
      <span><b>Total Ventas Recibido: </b> <span class="text-success"> $ ${formatNumber(caja.total_recibido)}</span></span>
      <span><b>Total Ventas Egresado: </b> <span class="text-danger"> $ ${formatNumber(caja.value_egresos)}</span></span>
      <p><b>Ventas Hechas: </b> ${caja.ventas_hechas.length} | <b>Ventas eliminadas: </b> ${caja.ventas_eliminadas.length} <br> <b>Ventas Totales:</b> ${caja.ventas_hechas.length - caja.ventas_eliminadas.length}</p>
      <hr>
      <p><b>Ingresos: </b> <span class="text-success">${formatNumber(caja.ingreso)}</span> | <b>Total Ingresos: </b> ${caja.ingresos.length}</p>
      <p><b>Egresos: </b> <span class="text-danger">${formatNumber(caja.egreso)}</span> | <b>Total Egresos: </b> ${caja.egresos.length}</p>


      <hr>
      <h4><b>Valor actual:</b> $ ${formatNumber(caja.value)}</h4>
      <br>
      <button class="btn btn-outline-info" onclick="cerrarCaja()"><i class="fa-solid fa-parachute-box"></i> Cerrar Caja / Servicio</button>
      <hr>
      <h3>Servicio de cajas</h3>
      <p>Las cajas que han sido cerradas pueden volver a ser abiertas en cualquier momento, pero para eso se tienen que tener permisos de administración.</p>
      <button class="btn btn-outline-primary" onclick="reabrirCaja()"><i class="fa-regular fa-folder-open"></i> Reabrir Caja</button>
    </div>
  `; 
}

router.get(['/caja'], () => {
  return reloadCaja();
});

function deleteClient(id){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('deleteClient', {
    token: token,
    client: id
  });
}

function editClient(id, e){
  let data = {
    name: e[0].value,
    type: e[1].value,
    document: e[2].value,
    phone: e[3].value,
    correo: e[4].value,
    city: e[5].value,
    direccion: e[6].value,
    id: id
  }

  let token = sessionStorage.getItem('acape-session');

  socket.emit('editClient', {
    client: data,
    token: token
  });
  return false;
}

function editarCliente(id){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('getAllClients', token);

  socket.once('getAllClients', (data) => {
    let cliente = data.data[id];
    popup.open({
      title: "Manager Cliente",
      content: `
        <form onsubmit="return editClient('${cliente.id}', this)">
          <p>El usuario actual es el # ${id}</p>
          <label>Nombre del cliente</label> 
          <input type="text" required class="form-control" value="${cliente.name}" placeholder="Ejem: Jhon Doe Carreo">

          <label>Documento de identidad</label>
          <div class="input-group mb-3">
            <select value="${cliente.type}" class="form-valuate w-auto" required>
              <option value="cc">C.C</option>
              <option value="ti">T.I</option>
              <option value="ex">Ext</option>
            </select>
            <input type="number" value="${cliente.document}" required class="form-control d-inline" placeholder="Ejem: 102029192">
          </div>

          <label>Numero de telefono (Colombiano)</label>
          <div class="input-group mb-3">
            <span class="input-group-text">+57</span>
            <input type="number" value="${cliente.phone}" required class="form-control d-inline" placeholder="Ejem: 3112259328">
          </div>

          <label>Correo Electronico</label>
          <div class="input-group mb-3">
          <span class="input-group-text">Email</span>
            <input type="text" value="${cliente.correo}" required class="form-control" placeholder="Ejem: email@example.com">
          </div>

          <label>Lugar de expedicion</label>
          <input type="text" value="${cliente.city}" required class="form-control" placeholder="Fortul - Arauca">

          <label>Dirección del pedido / vivienda</label>
          <input type="text" value="${cliente.direccion}" required class="form-control" placeholder="Calle #15 12-13">
          <br>
          <div class="edit-buttons">
            <button class="btn btn-outline-info w-100"><i class="fa-solid fa-pen"></i> Editar</button>
            <div class="btn btn-outline-danger w-100" onclick="deleteClient('${cliente.id}')"><i class="fa-solid fa-trash"></i> Eliminar</div>
          </div>
        </form>
      `
    })
  })
}

function reloadClientes(){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('getAllClients', token);
  socket.once('getAllClients', (data) => {
    if(!data.data) return Toast.fire({
      title: "Clientes",
      text: data.message
    });

    let array_clients = converterArray(data.data);
    let maping_clients = array_clients.map(ch => `
      <tr>
        <td>${ch.id}</td>
        <td>${ch.name}</td>
        <td>${ch.document}</td>
        <td>${ch.phone}</td>
        <td>
          <button class="btn btn-outline-info" onclick="editarCliente('${ch.id}')"><i class="fa-solid fa-pen"></i></button>
        </td>
      </tr>
    `);
    $('.tbody-clientes').html(maping_clients)
  })
}

function submitCreateClient(e){
  let data = {
    name: e[0].value,
    type: e[1].value,
    document: e[2].value,
    phone: e[3].value,
    correo: e[4].value,
    city: e[5].value,
    direccion: e[6].value
  }
  let token = sessionStorage.getItem('acape-session');
  socket.emit('createClient', {
    client: data,
    token: token
  })

  return false;
}

function createClient(){
  popup.open(({
    title: "Crear Cliente",
    content: `
      <form class="form-inline" onsubmit="return submitCreateClient(this)">
        <p>Crea un cliente para poder facturar a nombre de este cliente.</p>
        <label>Nombre Completo Del Cliente</label>
        <input type="text" required class="form-control" required placeholder="Ejem: Jhon Andres Doe Clinton">
        
        <br>
        <label>Documento de identidad</label>
        <div class="input-group mb-3">
          <select value="cc" class="form-valuate w-auto" required>
            <option value="cc">C.C</option>
            <option value="ti">T.I</option>
            <option value="ex">Ext</option>
          </select>
          <input type="number" required class="form-control d-inline" placeholder="Ejem: 102029192">
        </div>

        <label>Numero de telefono (Colombiano)</label>
        <div class="input-group mb-3">
          <span class="input-group-text">+57</span>
          <input type="number" required class="form-control d-inline" placeholder="Ejem: 3112259328">
        </div>

        <label>Correo Electronico</label>
        <div class="input-group mb-3">
        <span class="input-group-text">Email</span>
          <input type="text" required class="form-control" placeholder="Ejem: email@example.com">
        </div>

        <label>Lugar de expedicion</label>
        <input type="text" required class="form-control" placeholder="Fortul - Arauca">

        <label>Dirección del pedido / vivienda</label>
        <input type="text" required class="form-control" placeholder="Calle #15 12-13">
        <br>
        <button required class="btn btn-outline-primary d-block w-100">Guardar Cliente</button>
      </form>
    `
  }))
}

router.get('/clientes', () => {
  sessionValidator();
  reloadClientes();
  return `
    <div class="my-2 container-fluid">
      <h3 class="text-center">Clientes</h3>
      <p class="text-center">La zona de clientes tiene un accesso restringido.</p>
      <div class="text-center">
        <button class="btn btn-outline-primary" onclick="createClient()">Nuevo Cliente</button>
      </div>
      <br>
      <div class="clients-table">
        <table class="table-products">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Telefono</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody class="tbody-clientes">  
          </tbody>
        </table>
      </div>
    </div>
  `;
})

function updateFacturas(){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('getAllData', token);
  socket.once('allData', (data) => {
    if(!data.data) return Toast.fire({
      title: "Error de permisos",
      text: "Parece que tu usuario no tiene permisos para facturar.",
    });

    localStorage.setItem('all-data-server', JSON.stringify(data.data));
  })
}

function imprimirFactura(){
  let element = document.querySelector('.factura-termica');
  document.querySelector('body').innerHTML = `
    <div class="factura-termica">
      ${element.innerHTML}
    </div>
  `;
  window.print();

  setTimeout(() => {
    location.reload()
  }, 1000)
}

function generarPDF(id, ele, pd){
  var element = ele?ele:document.querySelector('.factura-termica');
  let generado = html2pdf(element, {
    margin: pd?pd:0,
    filename: `${id}-${new Date()-0}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  });
}

function changeUser(e){
  $('.change-user').html(e.value)
}

function facturaHoja(){
  generarPDF('hoja', document.querySelector('.hoja-factura'), 0.1);
}

function hojaFactura(id){
  let configs = localStorage.getItem('configs')?JSON.parse(localStorage.getItem('configs')):{user: {}}

  let token = sessionStorage.getItem('acape-session');
  socket.emit('getAllData', token);
  socket.once('allData', (data) => {
    let ventas = data.data.ventas;
    if(!data.data.ventas[id]) return Toast.fire({
      title: "Hoja de factura",
      text: "Parece que esta venta ya no existe."
    });

    $('.app').toggleClass('d-none');
    $('.menu').toggleClass('d-none');
    $('.hoja-factura').toggleClass('active-factura');

    let venta = ventas[id];

    popup.start();
    
    $('.hoja-factura').html(`
      <div class="title-header">
        <h1>${configs.name?configs.name:"Factura Hoja"}</h1>
        <p>${configs.slogan?configs.slogan:"Para servirte."}</p>
      </div>
      <hr>
      <div class="factura-hoja">
        <h1 class="change-cliente-name">Cliente Común</h1>
        <p class="change-cliente-text">
          <span>Dirección: ---</span><br>
          <span>Telefono: ---</span><br>
          <span>Documento: ---</span>
        </p>
      </div>
      <hr>
      <div class="starting-factura px-3">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Precio Total</th>
            </tr>
          </thead>
          <tbody>
            ${venta.products.map(ch => `
              <tr>
                <td>${data.data.products[ch.id].id}</td>
                <td>${data.data.products[ch.id].name}</td>
                <td>${ch.precio_unitario}</td>
                <td>${ch.cantidad}</td>
                <td>${ch.precio_final}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <br>
      <div class="footer">
        <h6>Precio Total: ${venta.total_pago}</h6>
        <h6>Recibido: ${venta.recibido}</h6>
        <h6>Dinero devuelto: ${eval(venta.recibido) - eval(venta.total_pago)}</h6>
      </div>
      <div class="footer">
        <span><b>Factura # ${id}</b></span><br>
        <span>Movimiento Hecho: ${new Date(venta.date).toLocaleString()}</span><br>
      </div>
      <hr>
      <div class="footer">
        <h4>Titular: ${configs.user.name?configs.user.name:"-----"}</h4>
        <span>Documento: ${configs.user.document?configs.user.document:"-----"}</span><br>
        <span>Telefono: ${configs.user.phone?configs.user.phone:"-----"}</span><br>
        <span>Email: ${configs.user.email?configs.user.email:"-----"}</span><br>
        <span>Dirección: ${configs.user.direct?configs.user.direct:"-----"}</span>
      </div>
    `)
  })
}

function factVenta(id){
  let data = JSON.parse(localStorage.getItem('all-data-server'));

  let configs = !localStorage.getItem('configs')?{}:JSON.parse(localStorage.getItem('configs'))

  let ventas = converterArray(data.ventas);
  let filter_ventas = ventas.filter(ch => new Date() - timems('1d') <= ch.date);
  let finding_venta = data.ventas[id];
  if(!finding_venta) return Toast.fire({
    text: "Parece que esta venta ya no existe.",
    icon: "error"
  });

  popup.open({
    title: `Facturando ${id}`,
    content: `
      <div class="facturar pd-1">
        <select class="form-select" onchange="changeUser(this)">
          <option value="Cliente Común">Cliente Común</option>
          ${converterArray(data.clientes).map(ch => `<option value="${ch.name}">${ch.name}</option>`)}
        </select>
        <hr>
        <div class="factura-termica">
          <div class="factura-head">
            <h1 class="text-center">${configs.name?configs.name:"Factura Desprendible"}</h1>
            <p class="text-center">${configs.slogan?configs.slogan:"Para servirte"}</p>
            <p>Esta factura esta guardada de manera digital, puedes pedirla al establecimiento o negocio.</p>
            <br>
          </div>
          <table class="factura-body">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>P. Unit</th>
                <th>Cant</th>
                <th>P. Fin</th>
              </tr>
            </thead>
            <tbody>
              ${finding_venta.products.map(ch => `
                <tr>
                  <td>${ch.id}</td>
                  <td>${data.products[ch.id].name}</td>
                  <td>${ch.precio_unitario}</td>
                  <td>${ch.cantidad}</td>
                  <td>${ch.precio_final}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <br>
          <span><b>Cliente:</b> <l class="change-user">${finding_venta.cliente?finding_venta.cliente:"Cliente Común"}</l></span><br>
          <span><b>Fecha de la compra:</b> ${new Date(finding_venta.date).toLocaleDateString()}</span><br>
          <span><b>ID de la compra: </b> ${finding_venta.id}</span>
          <br>
          <br>
          <span class="price-data"><b>Total Recibido: </b> $ ${formatNumber(finding_venta.recibido)}</span>
          <br>
          <span class="price-data"><b>Total A Pagar: </b> $ ${formatNumber(finding_venta.total_pago)}</span>
          <hr>
          <span class="price-data"><b>Dinero Devuelto: </b>$ ${formatNumber(eval(finding_venta.recibido) - eval(finding_venta.total_pago))}</span>
        </div>

        <hr>
        <button class="btn btn-outline-primary" onclick="generarPDF('${finding_venta.id}')">Generar PDF</button>
        <button class="btn btn-outline-success" onclick="imprimirFactura('${finding_venta.id}')">Imprimir</button>
        <br><br>
        <button class="btn btn-outline-info" onclick="hojaFactura('${finding_venta.id}')">Generar Hoja De Factura</button>
      </div>
    `,
    closeButtonFunction: facturaVenta
  })
}

function facturaVenta(){
  updateFacturas();

  let data = JSON.parse(localStorage.getItem('all-data-server'));
  let ventas = converterArray(data.ventas);
  let filter_ventas = ventas.filter(ch => new Date() - timems('1d') <= ch.date);
  popup.open({
    title: "Facturar ventas",
    content: `
      <div>
        <p>Las facturas de ventas se generan automaticamente.</p>
        ${filter_ventas.reverse().map(ch => `
            <div class="card">
              <div class="card-body">
                <b>ID: </b> ${ch.id} | <b>Productos: </b> ${ch.products.length} | <b>Recibido:</b> ${ch.recibido}
                <b>Total Pago: </b> ${ch.total_pago} | <b>Cambio: </b> ${eval(ch.recibido)-eval(ch.total_pago)}
              </div>
              <div class="card-footer">
                <button class="btn btn-outline-info" onclick="factVenta('${ch.id}')"><i class="fa-solid fa-eye"></i></button>
              </div>
            </div>
          `)}
      </div>
    `
  })
}

function facturaViewIngreso(date){
  let caja = JSON.parse(localStorage.getItem('caja'));
  let ingresos = caja.ingresos
  let finding_ingreso = ingresos.find(ch => ch.date == date);

  let configs = !localStorage.getItem('configs')?{}:JSON.parse(localStorage.getItem('configs'))
  configs = configs?configs:{};

  popup.open({
    title: `Creando factura de ingreso`,
    content: `
      <div class="facturar pd-1">
        <div class="factura-termica">
          <div class="factura-head">
            <h1 class="text-center">${configs.name?configs.name:"Factura Desprendible"}</h1>
            <p class="text-center">${configs.slogan?configs.slogan:"Para servirte"}</p>
            <br>
          </div>
          <table class="factura-body">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${new Date(finding_ingreso.date).toLocaleDateString()}</td>
                <td>${formatNumber(finding_ingreso.money)}</td>
                <td>${finding_ingreso.description}</td>
              </tr>
            </tbody>
          </table>
          <br>
          <p>Este ingreso fue registrado en el turno actual de la caja, la caja fue abierta: ${new Date(caja.date).toLocaleString()}</p>
        </div>

        <hr>
        <button class="btn btn-outline-primary" onclick="generarPDF('ingreso')">Generar PDF</button>
        <button class="btn btn-outline-success" onclick="imprimirFactura('ingreso')">Imprimir</button>
      </div>
    `,
    closeButtonFunction: facturaIngreso
  })
}

function facturaIngreso(){
  updateFacturas();

  let data = JSON.parse(localStorage.getItem('all-data-server'));
  let caja = JSON.parse(localStorage.getItem('caja'));

  let ingresos = caja.ingresos;
  let final_html = !ingresos[0]?"No hay ingresos registrados":ingresos.map(ch => `<div class="card">
    <div class="card-body">
      <div class="content-card">
        <b>Registro: </b> Hace ${getTimeLong(new Date() - new Date(ch.date))}<br>
        <b>Entrada: </b> $ ${formatNumber(ch.money)} - ${ch.description}
      </div>
    </div>
    <div class="card-footer"><button class="btn btn-outline-primary" onclick="facturaViewIngreso('${ch.date}')"><i class="fa-solid fa-eye"></i></button></div>
  </div>`)

  popup.open({
    title: "Facturar Ingreso",
    content: `
      <div class="facturar">
        <div class="cards">
          ${final_html}
        </div>
      </div>
    `
  })
}

function facturaViewEgreso(date){
  let caja = JSON.parse(localStorage.getItem('caja'));
  let egresos = caja.egresos
  let finding_egreso = egresos.find(ch => ch.date == date);

  let configs = !localStorage.getItem('configs')?{}:JSON.parse(localStorage.getItem('configs'))
  configs = configs?configs:{};

  popup.open({
    title: `Creando factura de egreso`,
    content: `
      <div class="facturar pd-1">
        <div class="factura-termica">
          <div class="factura-head">
            <h1 class="text-center">${configs.name?configs.name:"Factura Desprendible"}</h1>
            <p class="text-center">${configs.slogan?configs.slogan:"Para servirte"}</p>
            <br>
          </div>
          <table class="factura-body">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Salida</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${new Date(finding_egreso.date).toLocaleDateString()}</td>
                <td>-${formatNumber(finding_egreso.money)}</td>
                <td>${finding_egreso.description}</td>
              </tr>
            </tbody>
          </table>
          <br>
          <p>Este egreso fue registrado en el turno actual de la caja, la caja fue abierta: ${new Date(caja.date).toLocaleString()}</p>
        </div>

        <hr>
        <button class="btn btn-outline-primary" onclick="generarPDF('egreso')">Generar PDF</button>
        <button class="btn btn-outline-success" onclick="imprimirFactura('egreso')">Imprimir</button>
      </div>
    `,
    closeButtonFunction: facturaEgreso
  })
}

function facturaEgreso(){
  updateFacturas();

  let data = JSON.parse(localStorage.getItem('all-data-server'));
  let caja = JSON.parse(localStorage.getItem('caja'));

  let egresos = caja.egresos;
  let final_html = !egresos[0]?"No hay egresos registrados":egresos.map(ch => `<div class="card">
    <div class="card-body">
      <div class="content-card">
        <b>Registro: </b> Hace ${getTimeLong(new Date() - new Date(ch.date))}<br>
        <b>Entrada: </b> $ ${formatNumber(ch.money)} - ${ch.description}
      </div>
    </div>
    <div class="card-footer"><button class="btn btn-outline-success" onclick="facturaViewEgreso('${ch.date}')"><i class="fa-solid fa-eye"></i></button></div>
  </div>`)

  popup.open({
    title: "Facturar Egreso",
    content: `
      <div class="facturar">
        <div class="cards">
          ${final_html}
        </div>
      </div>
    `
  })
}

router.get('/facturero', () => {
  sessionValidator()

  updateFacturas()

  return `<div class="container-fluid">
    <br>
    <h1 class="text-center">Facturero</h1>
    <p class="text-center">Crea tus facturas de ingresos, egresos y ventas</p>
    <div class="text-center">
      <button class="btn btn-outline-primary" onclick="facturaVenta()">Crear Factura De Venta</button>
      <button class="btn btn-outline-info" onclick="facturaIngreso()">Crear Factura De Ingreso</button>
      <button class="btn btn-outline-success" onclick="facturaEgreso()">Crear Factura De egreso</button>
    </div>

    <div class="facturero-container"></div>
  </div>`;
})

function saveConfigsBasic(e){
  let data = {
    name: e[0].value,
    slogan: e[1].value,
    user: {
      name: e[2].value,
      document: e[3].value,
      phone: e[4].value,
      email: e[5].value,
      direct: e[6].value
    }
  }

  localStorage.setItem('configs', JSON.stringify(data));

  Toast.fire({
    title: "Configuraciones",
    text: "Nueva configuración guardad exitosamente",
    icon: "success"
  })
  return false;
}

function sendEditUser(e, id, ident){
  let data = {
    user: e[0].value,
    password: e[1].value,
    role: e[2].value,
    token: id,
    id: ident
  }
  let token = sessionStorage.getItem('acape-session');
  socket.emit('editUser', {user: data, token: token});

  return false;
}

function sendDeleteUser(token){
  let session = sessionStorage.getItem('acape-session');
  alert.fire({
    title: "Eliminar usuario",
    text: "¿Estas seguro de eliminar a este usuario?",
    confirmButtonText: "SI",
    showCancelButton: true,
    cancelButtonText: "NO"
  }).then((result) => {
    if(result.isConfirmed){
      socket.emit('deleteUser', {user: token, token: session});
    }
  })
}

function editUser(id){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('configServ', token);
  socket.once('configServ', (data) => {
    if(!data.data) return Toast.fire({
      message: "No tienes permisos",
      icon: "error"
    });

    let roles = Object.keys(data.data.roles);

    let usuario = data.data.users[id];
    if(!usuario) return Toast.fire({
      message: "Parece que este usuario ya ha sido eliminado",
      icon: "error"
    });

    popup.open({
      title: "Configurando usuario",
      content: `
        <form onsubmit="return sendEditUser(this, '${usuario.token}', '${usuario.id}')">
          <label>Nombre de usuario</label>
          <input type="text" class="form-control" placeholder="Nombre de usuario" value="${usuario.user}">
          <label>Contraseña</label>
          <input type="text" class="form-control" placeholder="Contraseña" value="${usuario.password}">
          <label>Rol</label>
          <select class="form-select">
            <option value="${usuario.role}">${usuario.role} (Actual del usuario)</option>
            ${roles.map(ch => `<option value="${ch}">${ch}</option>`)}
          </select>
          <br>
          <div class="edit-buttons">
            <button class="btn w-50 btn-outline-primary">Guardar Cambios</button>
            <a class="btn w-50 btn-outline-danger" onclick="sendDeleteUser('${usuario.token}')">Eliminar Usuario</a>
          </div>
        </form>
      `
    })
  })
}

function sendCreateUser(e){
  let data = {
    user: e[0].value,
    password: e[1].value,
    role: e[2].value
  }

  let token = sessionStorage.getItem('acape-session');

  socket.emit('createUser', {user: data, token: token});

  return false;
}

function createUser(){
  let token = sessionStorage.getItem('acape-session');

  socket.emit('configServ', token);
  socket.once('configServ', (data) => {
    if(!data.data) return Toast.fire({
      text: "Error de permisos",
      icon: "error"
    });

    let roles = Object.keys(data.data.roles);

    popup.open({
      title: "Crear un nuevo usuario",
      content: `
        <form onsubmit="return sendCreateUser(this)">
          <label>Nombre de usuario</label>
          <input type="text" class="form-control" placeholder="Ejem: usuario cajero"
          <label>Contraseña</label>
          <input type="text" class="form-control" placeholder="Ejem: pass123">
          <label>Rol del usuario</label>
          <select class="form-select">
            <option value="non-role">Elige un rol</option>
            ${roles.map(ch => `<option value="${ch}">${ch}</option>`)}
          </select>
          <br>
          <button class="btn btn-outline-primary d-block w-100"><i class="fa-solid fa-plus"></i> Crear nuevo usuario</button>
        </form>
      `
    })
  })
}

function editandoRol(e, name){
  let token = sessionStorage.getItem('acape-session');
  let data = {
    all: e[0].checked,
    productManager: e[1].checked,
    userManager: e[2].checked,
    roleManager: e[3].checked,
    clientManager: e[4].checked,
    facturar: e[5].checked,
    view: e[6].checked
  }
  socket.emit('editRole', {role: {name: name, perms: data}, token: token});
}

function deleteRole(name){
  let token = sessionStorage.getItem('acape-session');

  socket.emit('deleteRole', {role: name, token: token});
}

socket.on('role-manager', (data) => {
  Toast.fire({
    text: data.message,
    icon: data.data?"success":"error"
  });

  if(data.data) {
    popup.start()
    updateConfigs();
  };
})

function editarRol(name){
  if(name == "owner") return Toast.fire({
    text: "El rol owner no se puede modificar.",
    icon: "error"
  });
  socket.emit('configServ', sessionStorage.getItem('acape-session'));
  socket.once('configServ', (data) => {
    if(!data.data) return Toast.fire({
      text: "No tienes permisos suficientes.",
      icon: "error"
    });

    let received = data.data;
    let roles = received.roles;

    let finding_role = roles[name];
    if(!finding_role) return Toast.fire({
      text: "Este rol no existe.",
      icon: "error"
    });

    let keys_perms = finding_role;
    let all_permissions = [{
      input: "Administración", 
      perm: "all"
    },
    {
      input: "Manejar y editar productos", 
      perm: "productManager"
    },
    {
      input: "Modificar y eliminar usuarios", 
      perm: "userManager"
    },
    {
      input: "Modificar y eliminar roles", 
      perm: "roleManager"
    },
    {
      input: "Manejar clientes", 
      perm: "clientManager"
    }, 
    {
      input: "Poder facturar", 
      perm: "facturar"
    },{
      input: "Mirar facturas, ventas y otros datos de la aplicación",
      perm: "view"
    }]

    popup.open({
      title: `Editando rol ${name}`,
      content: `
        <form onsubmit="return editandoRol(this, '${name}')">
          <div class="listing">
            ${all_permissions.map(ch => `
              <input type="checkbox" ${!finding_role[ch.perm]==true?"non":"checked"}>
              <label htmlFor="">${ch.input}</label>
              <br>
            `).join('')}
          </div>
          <div class="separated-div">
            <button class="btn btn-outline-primary w-50"><i class="fa-solid fa-parachute-box"></i> Guardar Cambio</button>
            <a class="btn btn-outline-danger w-50" onclick="deleteRole('${name}')"><i class="fa-solid fa-trash"></i> Eliminar</a>
          </div>
        </form>
      `
    })
  })
}

function sendingNewRole(e){
  let token = sessionStorage.getItem('acape-session');
  socket.emit('createRole', {role: {name: e[0].value}, token: token});
}

function createNewRole(){
  popup.open({
    title: "Crea un nuevo rol",
    content: `
      <form onsubmit="return sendingNewRole(this)">
        <label htmlFor="">Nombre del rol</label>
        <input required class="form-control" type="text" placeholder="Ejem: Admin">
        <br>
        <button class="btn btn-outline-primary d-block w-100"><i class="fa-solid fa-gear"></i> Guardar Nuevo Rol</button>
      </form>
    `
  })
}

function updateConfigs(){
  let configs = !localStorage.getItem('configs')?{user: {}}:JSON.parse(localStorage.getItem('configs'));
  let token = sessionStorage.getItem('acape-session');

  socket.emit('configServ', token);
  socket.once('configServ', (received) => {
    if(!received.data) return alert.fire({
      title: "Error",
      text: "No tienes permisos suficientes para acceder a estas funciones.",
      icon: "error",
      footer: "Para acceder a las funciones de configuraciones necesitas tener todos los permisos activos"
    });

    let data = received.data;
    let usuarios = data.users;
    let roles = data.roles;

    let usuarios_array = converterArray(usuarios);
    let roles_array = Object.keys(data.roles);

    let final_roles = roles_array.map(ch => `
      <div class="card">
        <div class="card-body">
          <div class="separated-div">
            <div><b>Nombre: </b> ${ch}</div>
            <div class="btns">
              <button class="btn btn-outline-primary" onclick="editarRol('${ch}')">
                <i class="fa-solid fa-pen"></i> Editar
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('')

    let final_usuarios = usuarios_array.map(ch => `
      <div class="card">
        <div class="card-body">
          <div><b>ID: </b> ${ch.id} | <b>Nombre de usuario:</b> ${ch.user} | <b>Rol: </b> ${ch.role}</div>
        </div>
        <div class="card-footer">
          <button class="btn btn-outline-primary" onclick="editUser('${ch.id}')"><i class="fa-solid fa-pen"></i> Configurar usuario</button>
        </div>
      </div>
    `).join('')

    $('.app').html(`
      <div class="container-fluid my-2">
        <h1 class="text-center">Centro de configuraciones</h1>
        <p class="text-center">En este centro de configuraciones puedes configurar toda la aplicación</p>
        <hr>
        <p>Empecemos por lo basico, darle una marca y nombre a tu negocio/empresa</p>
        <form onsubmit="return saveConfigsBasic(this)">
          <label>Nombre de la empresa</label>
          <p>Este nombre aparecera en las facturas desprendibles</p>
          <input class="form-control" type="text" value="${configs.name?configs.name:''}" placeholder="Ejem: SIOPS Solutions">
          <br>
          <label>Eslogan</label>
          <p>El texto que aparece debajo del titulo en los desprendibles</p>
          <input type="text" class="form-control" value="${configs.slogan?configs.slogan:''}" placeholder="Ejem: Para servirte :)">
          <hr>
          <h5>Información del dueño / vendedor</h5>
          <label htmlFor="">Nombre del vendedor</label>
          <input type="text" value="${configs.user.name?configs.user.name:""}" class="form-control" placeholder="Ejem: Jhon Doe Arnuld">
          <label>Numero de identidad o documento</label>
          <input type="number" class="form-control" placeholder="Ejem: 1112929019" value="${configs.user.document?configs.user.document:""}">
          <label htmlFor="">Numero de telefono</label>
          <input type="number" value="${configs.user.phone?configs.user.phone:""}" class="form-control" placeholder="Ejem: 3112232020">
          <label htmlFor="">Correo Electronico</label>
          <input type="text" class="form-control" value="${configs.user.email?configs.user.email:""}" placeholder="email@example.com">
          <label htmlFor="">Dirección del establecimiento</label>
          <input type="text" class="form-control" value="${configs.user.direct?configs.user.direct:""}" placeholder="Ejem: Calle 12 #9-23 Fortul - Arauca">
          <br>
          <button class="btn btn-outline-primary">Guardar Marca</button>
        </form>
        <hr>
        <h3>Usuarios</h3>
        <p>Crea usuarios para darle a tus empleados acceso a la aplicación, recuerdas darles un rol para que el usuario no pueda acceder a ciertas funciones de administración</p>
        <button class="btn btn-outline-primary d-block w-100" onclick="createUser()"><i class="fa-solid fa-user"></i> Crear un nuevo usuario</button>
        <br>
        <p>Los usuarios creados actualmente son: ${usuarios_array.length}</p>
        <div class="users-container">${final_usuarios}</div>
        <hr>
        <h3>Roles</h3>
        <p>Los roles sirven para que tus otros usuarios tengan permisos espesificos y pueda acceder a las funciones de forma limitada.</p>
        <button class="btn btn-outline-primary btn-block w-100 d-block" onclick="createNewRole()"><i class="fa-solid fa-address-book"></i> Crear nuevo rol</button>
      </div>
      <div class="roles-container">${final_roles}</div>
    `)
  })
}

router.get('/config', () => {
  sessionValidator()
  updateConfigs()

  return `Ingresando...`;
})

function cerrarSesion(){
  sessionStorage.removeItem('acape-session');
  location.hash = "#/";
  location.reload()
  sessionValidator();
}

function validTokenPopup(title){
  popup.open({
    title: title?title:"Primer Inicio",
    content: `
      <form onsubmit="return sendValidationToken(this)">
        <p>Es el primer inicio de la aplicación, ingresa el token de la app para poder iniciar.</p>
        <label htmlFor="">Token de la aplicación: </label>
        <input type="text" class="form-control" placeholder="xxxx-xxxx-xxxx-xxxx">
        <br>
        <button class="btn btn-outline-primary d-block w-100 validate-button">Validar</button>
      </form>
    `,
    close: title?true:false
  })
}

function updateUser(){
  let simple_data = localStorage.getItem('acape-data-principal')?JSON.parse(localStorage.getItem('acape-data-principal')):{}
  socket.emit('get_token_valid', simple_data.token);
  socket.once('get_token_valid', (data) => {
    if(!data.data) return $('.valid-token').html('<h5>La validación del token es nula</h5>');

    let sirving = data.data;
    let tiempo_restante = getTimeRest(new Date(sirving.timeRest)-0);
    $('.valid-token').html(`
      <br><hr>
      <h5>Token y suscripción de la aplicación</h5>
      <p>Puedes obtener un token de prueba en nuestro sitio web de SIOPS.</p>
      <p>A tu suscripción todavia le quedan: ${tiempo_restante}</p>
      <button class="btn btn-outline-primary" onclick="validTokenPopup('Validar otro token')"><i class="fa-solid fa-scroll"></i> Validar Otro Token</button>
    `);
  })

  return `
    <div class="container-fluid my-2">
      <h1>Usuario</h1>
      <p>Las configuraciones de usuario se encuentran justo aqui.</p>
      <hr>
      <p>Si quieres modificar algún parametro de tu cuenta esto lo puedes hacer en el apartado de administración, aqui solamente puedes cerrar sesión, o validar tu token como usuario de SIOPS.</p>
      <hr>
      <button class="btn btn-danger" onclick="cerrarSesion()"><i class="fa-solid fa-door-open"></i> Cerrar Sesion</button>
      <hr>
      <div class="valid-token"></div>
    </div>
  `;
}

router.get('/user', () => {
  sessionValidator();
  return updateUser();
})

// Función para sumar objetos consecutivos por tipo y manejar los no consecutivos
function sumarConsecutivos(arreglo) {
    if (arreglo.length === 0) {
        return [];
    }

    let resultado = [];
    let tipoActual = arreglo[0].type;
    let sumaActual = arreglo[0].cantidad;

    for (let i = 1; i < arreglo.length; i++) {
        if (arreglo[i].type === tipoActual) {
            sumaActual += arreglo[i].cantidad;
        } else {
            resultado.push({ type: tipoActual, cantidad: sumaActual });
            tipoActual = arreglo[i].type;
            sumaActual = arreglo[i].cantidad;
        }
    }

    // Agregar el último tipo acumulado
    resultado.push({ type: tipoActual, cantidad: sumaActual });

    return resultado;
}


function reloadChart(){
  socket.emit('getAllData', sessionStorage.getItem('acape-session'));
  socket.once('allData', (data) => {
    if(!data.data) return Toast.fire({
      text: "No tienes permisos suficientes.",
      icon: "error"
    });


    let caja = JSON.parse(localStorage.getItem('caja'));
    let caja_starting = caja.starting;

    let final_array_value = [];
    let ordenar = [];
    caja.ingresos.forEach((element, i, array) => {
      return ordenar.push({
        date: element.date,
        cantidad: +element.money,
        type: "ingreso"
      });
    });
    caja.egresos.forEach((element) => {
      return ordenar.push({
        date: element.date,
        cantidad: -element.money,
        type: "egreso"
      });
    });
    caja.ventas_hechas.forEach((element) => {
      return ordenar.push({
        date: element.date,
        cantidad: +element.total_pago,
        type: "V. Hecha"
      });
    });
    caja.ventas_eliminadas.forEach((element) => ordenar.push({date: element.date, cantidad: -element.total_pago, type: "V. Elim"}));

    let final_movements = ordenar.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let data_to_chart = sumarConsecutivos(ordenar);

    let final_chart = [caja_starting];

    data_to_chart.forEach((element) => {
      let before_object = final_chart[final_chart.length-1];
      

      final_chart.push(before_object + element.cantidad);
    })

    // CREATING CHART
    // const labels = Utils.months({count: 7});
    const dataChart = {
      labels: Array.from({length: final_chart.length}, (_, i) => i + 1),
      // labels: data_to_chart.map(ch => ch.type),
      datasets: [{
        label: 'Metricas De La Caja',
        data: final_chart,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };

    let charting_caja = new Chart(document.querySelector('.charting-1'), {
      data: dataChart,
      type: "line",
      options: {
        responsive: true,  // Hacer el gráfico responsive
        maintainAspectRatio: false,  // Permitir que el gráfico no mantenga el aspecto según el tamaño del contenedor
        scales: {
          y: {
            beginAtZero: true  // El eje Y comienza desde cero
          }
        }
      }
    });

    let cajas = converterArray(data.data.caja);

    let cajasChart = {
      labels: Array.from({length: cajas.length}, (_, i) => i + 1),
      datasets: [{
        label: "Metricas de todas las cajas",
        data: cajas.map(ch => ch.value),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    }

    // ST CAJAS
    let charting_stcajas = new Chart(document.querySelector('.charting-2'), {
      data: cajasChart,
      type: "line",
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
    // FINAL CHART
  })
}

router.get('/metricas', () => {
  sessionValidator();

  reloadChart();
  return `
    <div class="container-fluid my-2">
      <h1 class="text-center">Seguimiento</h1>
      <p>Mira las metricas de tu negocio</p>
      <p>Las metricas actuales son entregadas por el registro de caja, es decir si la caja falla, ninguna metrica es dada por otros datos es meramente de la caja.</p>
      <hr>
      <div class="chart-caja-1" style="width: 100%; height: 200px;"><canvas class="charting-1" width="100" height="100"></canvas></div>
      <hr>
      <h2>Segumiento de las cajas</h2>
      <p>Todas las cajas que han sido cerradas hasta ahora apareceran en esta grafica</p>
      <div class="chart-caja-2">
        <canvas class="charting-2"></canvas>
      </div>
    </div>
  `;
})

window.onload = () => {
  let dataApp = localStorage.getItem('acape-data-principal');
  if(!dataApp) {
    validTokenPopup()
  }else {
    socket.emit('token_validation', JSON.parse(dataApp).token);
    alert.fire({
      title: "Validando Suscripción",
      text: "Estamos validando la suscripción espera un momento",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      allowEnterKey: true
    })
  }
}

// SOCKETS MANAGER

socket.on('user-manager', (data) => {
  Toast.fire({
    text: data.message,
    icon: !data.data?"error":"success"
  })

  if(data.data){
    updateConfigs()
    popup.close();
  }
});

socket.on('products-manager', (data) => {
  Toast.fire({
    title: "Manager de productos",
    text: data.message,
    icon: data.data?"success":"error"
  })
  if(data.data){
    popup.close();
    getProducts()
  }
})

socket.on('ventas-manager', (data) => {

  Toast.fire({
    title: "Manager de ventas",
    text: data.message,
    icon: data.data?"success":"error"
  });


  if(data.data){
    sessionStorage.removeItem('actually-list-products');

    if(data.data == true) listingVentas();

    if(data.ventaEliminada) {
      let caja = localStorage.getItem('caja')?JSON.parse(localStorage.getItem('caja')):null;
      if(!caja) return;

      if(caja.date > data.ventaEliminada.date) return Toast.fire({
        title: "Manager de ventas",
        text: "Esta venta no fue hecha mientras estaba la caja actual activa asi que no tendra ningun efecto en las cuentas del dia.",
        icon: "success"
      });

      registCajaMinus(data.ventaEliminada, data.ventaEliminada.total_pago);
    }else {
      registCaja(data.data, data.data.total_pago);
      listingProducts();
    }
  }
})

socket.on('clientes-manager', (data) => {
  Toast.fire({
    title: "Clientes",
    text: data.message,
    icon: data.data?"success":"error"
  })

  if(data.data) {
    popup.close()
    reloadClientes();
  };
})

socket.on('ventaEdit', (data) => {
  if(!data.ventaEliminada) return;

  let caja = localStorage.getItem('caja')?JSON.parse(localStorage.getItem('caja')):null;
  if(!caja) return;

  if(caja.date > data.ventaEliminada.date) return Toast.fire({
    title: "Manager de ventas",
    text: "Esta venta no fue hecha mientras estaba la caja actual activa asi que no tendra ningun efecto en las cuentas del dia.",
    icon: "info"
  });

  registCajaMinus(data.ventaEliminada, data.ventaEliminada.total_pago);
})

router.start();

router.listen();
