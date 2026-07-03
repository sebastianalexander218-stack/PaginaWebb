// ============================================================
// NAVEGACIÓN ENTRE PÁGINAS VIRTUALES
// ============================================================
function irA(pagina) {
    const vistas = ['inicio', 'nosotros', 'productos'];
    vistas.forEach(v => {
        const el = document.getElementById('vista-' + v);
        if (el) el.classList.remove('activa');
        const btn = document.getElementById('btn-' + v);
        if (btn) btn.classList.remove('active');
    });
    const target = document.getElementById('vista-' + pagina);
    if (target) target.classList.add('activa');
    const btnTarget = document.getElementById('btn-' + pagina);
    if (btnTarget) btnTarget.classList.add('active');
}

// ============================================================
// CARRITO DE COMPRAS
// ============================================================
var carrito = [];

function addToCartDesdeBoton(boton) {
    var card = boton.closest('.oferta-card');
    if (!card) {
        console.error("No se encontró la tarjeta del producto");
        return;
    }
    var nombre = card.querySelector('h3').textContent.trim();
    var precioTexto = null;
    var precioAhora = card.querySelector('.precio-ahora');
    if (precioAhora) {
        precioTexto = precioAhora.textContent.trim();
    } else {
        var precioProducto = card.querySelector('.precio-producto');
        if (precioProducto) {
            precioTexto = precioProducto.textContent.trim();
        }
    }
    if (!precioTexto) {
        alert("No se pudo obtener el precio.");
        return;
    }
    var precio = parseFloat(precioTexto.replace('S/', '').trim());
    if (isNaN(precio)) {
        alert("Precio no válido.");
        return;
    }
    var existente = carrito.find(item => item.nombre === nombre && item.precio === precio);
    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({
            nombre: nombre,
            precio: precio,
            cantidad: 1
        });
    }
    renderizarCarrito();
    mostrarNotificacion(nombre + " agregado al carrito");
}

// Delegación de eventos para botones "Pedir Producto" / "Pedir Combo"
document.addEventListener('click', function(e) {
    var boton = e.target.closest('.btn-adquirir');
    if (boton) {
        // Solo si está dentro de las vistas de productos o inicio
        if (document.getElementById('vista-productos').contains(boton) ||
            document.getElementById('vista-inicio').contains(boton)) {
            e.preventDefault();
            addToCartDesdeBoton(boton);
        }
    }
});

function toggleCarrito() {
    var modal = document.getElementById('carrito-modal');
    if (modal.classList.contains('abierto')) {
        modal.classList.remove('abierto');
    } else {
        modal.classList.add('abierto');
        renderizarCarrito();
    }
}

function renderizarCarrito() {
    var contenedor = document.getElementById('carrito-items');
    var totalSpan = document.getElementById('carrito-total');
    var badge = document.getElementById('cart-badge');

    var total = 0;
    var cantidadTotal = 0;
    carrito.forEach(function(item) {
        total += item.precio * item.cantidad;
        cantidadTotal += item.cantidad;
    });

    badge.textContent = cantidadTotal;
    totalSpan.textContent = 'Total: S/ ' + total.toFixed(2);

    if (carrito.length === 0) {
        contenedor.innerHTML = '<div class="carrito-vacio">El carrito está vacío</div>';
        return;
    }

    var html = '';
    carrito.forEach(function(item, index) {
        html += `
        <div class="carrito-item">
            <div class="carrito-item-info">
                <div class="carrito-item-nombre">${item.nombre}</div>
                <div class="carrito-item-precio">S/ ${item.precio.toFixed(2)} c/u</div>
                <div>Subtotal: S/ ${(item.precio * item.cantidad).toFixed(2)}</div>
            </div>
            <div class="carrito-item-acciones">
                <input type="number" class="carrito-cantidad" value="${item.cantidad}" min="1" 
                    onchange="actualizarCantidad(${index}, this.value)">
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${index})">×</button>
            </div>
        </div>
        `;
    });
    contenedor.innerHTML = html;
}

function actualizarCantidad(index, nuevaCantidad) {
    var cant = parseInt(nuevaCantidad);
    if (isNaN(cant) || cant < 1) {
        cant = 1;
    }
    carrito[index].cantidad = cant;
    renderizarCarrito();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    renderizarCarrito();
}

function vaciarCarrito() {
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
        carrito = [];
        renderizarCarrito();
    }
}

function mostrarNotificacion(mensaje) {
    var notif = document.createElement('div');
    notif.textContent = mensaje;
    notif.style.position = 'fixed';
    notif.style.bottom = '20px';
    notif.style.right = '20px';
    notif.style.background = '#2a6e3f';
    notif.style.color = 'white';
    notif.style.padding = '12px 20px';
    notif.style.borderRadius = '25px';
    notif.style.zIndex = '99999';
    notif.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    notif.style.fontWeight = '600';
    document.body.appendChild(notif);
    setTimeout(function() {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.5s';
        setTimeout(function() { document.body.removeChild(notif); }, 500);
    }, 1500);
}

function finalizarCompra() {
    var nombreInput = document.getElementById('cliente-nombre');
    var telefonoInput = document.getElementById('cliente-telefono');

    if (!nombreInput || !telefonoInput) {
        alert('Error: no se encontraron los campos de nombre y teléfono.');
        return;
    }

    var nombre = nombreInput.value.trim();
    var telefono = telefonoInput.value.trim();

    if (carrito.length === 0) {
        alert('El carrito está vacío. Agrega productos primero.');
        return;
    }

    if (!nombre || !telefono) {
        alert('Por favor, ingresa tu nombre y teléfono para confirmar la compra.');
        return;
    }

    var total = carrito.reduce(function(sum, item) {
        return sum + item.precio * item.cantidad;
    }, 0);

    var items = carrito.map(function(item) {
        return {
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio
        };
    });

    fetch('/finalizar_compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cliente: nombre,
            telefono: telefono,
            total: total,
            items: items
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            alert(data.message);
            vaciarCarrito();
            toggleCarrito();
            nombreInput.value = '';
            telefonoInput.value = '';
        }
    })
    .catch(function(error) {
        alert('Hubo un problema al registrar tu compra. Intenta de nuevo.');
        console.error('Error:', error);
    });
}

// ============================================================
// ADMINISTRACIÓN DE CLIENTES (solo si existe el panel)
// ============================================================
var clientes = [];
var nextId = 1;
var editandoId = null;
var eliminandoId = null;

function renderTabla(lista) {
    var tbody = document.getElementById('cuerpo-tabla');
    var sinResultados = document.getElementById('sin-resultados');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!lista || lista.length === 0) {
        if (sinResultados) sinResultados.style.display = 'block';
        return;
    }
    if (sinResultados) sinResultados.style.display = 'none';
    for (var i = 0; i < lista.length; i++) {
        var c = lista[i];
        var fila = document.createElement('tr');
        fila.style.borderBottom = '1px solid #e0e0e0';
        fila.style.background = (i % 2 === 0) ? '#f9fdf9' : '#ffffff';
        var idCliente = c.id;
        fila.innerHTML =
            '<td style="padding:12px 14px;">' + c.id + '</td>' +
            '<td style="padding:12px 14px; font-weight:600;">' + c.nombre + '</td>' +
            '<td style="padding:12px 14px;">' + c.telefono + '</td>' +
            '<td style="padding:12px 14px;">' + (c.direccion || '—') + '</td>' +
            '<td style="padding:12px 14px; text-align:center;">' +
                '<button onclick="abrirModalEditar(' + idCliente + ')" style="background:#2980b9; color:white; border:none; padding:7px 15px; border-radius:25px; cursor:pointer; font-size:13px; margin-right:6px; transition:0.2s;">Editar</button>' +
                '<button onclick="abrirModalEliminar(' + idCliente + ')" style="background:#c0392b; color:white; border:none; padding:7px 15px; border-radius:25px; cursor:pointer; font-size:13px; transition:0.2s;">Eliminar</button>' +
            '</td>';
        tbody.appendChild(fila);
    }
}

function buscarCliente() {
    var q = document.getElementById('buscar-cliente').value.toLowerCase().trim();
    if (q === '') {
        renderTabla(clientes);
        return;
    }
    var filtrados = [];
    for (var i = 0; i < clientes.length; i++) {
        var c = clientes[i];
        if (c.nombre.toLowerCase().indexOf(q) !== -1 || c.telefono.indexOf(q) !== -1) {
            filtrados.push(c);
        }
    }
    renderTabla(filtrados);
}

function abrirModalAgregar() {
    editandoId = null;
    document.getElementById('modal-titulo').textContent = 'Agregar Cliente';
    document.getElementById('inp-nombre').value = '';
    document.getElementById('inp-telefono').value = '';
    document.getElementById('inp-direccion').value = '';
    document.getElementById('modal-error').style.display = 'none';
    document.getElementById('modal-cliente').style.display = 'flex';
}

function abrirModalEditar(id) {
    var cliente = null;
    for (var i = 0; i < clientes.length; i++) {
        if (clientes[i].id === id) { cliente = clientes[i]; break; }
    }
    if (!cliente) return;
    editandoId = id;
    document.getElementById('modal-titulo').textContent = 'Editar Cliente';
    document.getElementById('inp-nombre').value = cliente.nombre;
    document.getElementById('inp-telefono').value = cliente.telefono;
    document.getElementById('inp-direccion').value = cliente.direccion || '';
    document.getElementById('modal-error').style.display = 'none';
    document.getElementById('modal-cliente').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('modal-cliente').style.display = 'none';
}

function guardarCliente() {
    var nombre = document.getElementById('inp-nombre').value.trim();
    var telefono = document.getElementById('inp-telefono').value.trim();
    var direccion = document.getElementById('inp-direccion').value.trim();
    var errorDiv = document.getElementById('modal-error');

    if (nombre === '' || telefono === '') {
        errorDiv.textContent = 'El nombre y el teléfono son obligatorios.';
        errorDiv.style.display = 'block';
        return;
    }
    errorDiv.style.display = 'none';

    if (editandoId === null) {
        clientes.push({ id: nextId, nombre: nombre, telefono: telefono, direccion: direccion });
        nextId++;
    } else {
        for (var i = 0; i < clientes.length; i++) {
            if (clientes[i].id === editandoId) {
                clientes[i].nombre = nombre;
                clientes[i].telefono = telefono;
                clientes[i].direccion = direccion;
                break;
            }
        }
    }
    cerrarModal();
    buscarCliente();
}

function abrirModalEliminar(id) {
    eliminandoId = id;
    var cliente = null;
    for (var i = 0; i < clientes.length; i++) {
        if (clientes[i].id === id) { cliente = clientes[i]; break; }
    }
    if (!cliente) return;
    document.getElementById('confirmar-nombre').textContent = 'Se eliminará a: ' + cliente.nombre;
    document.getElementById('modal-eliminar').style.display = 'flex';
}

function cerrarModalEliminar() {
    document.getElementById('modal-eliminar').style.display = 'none';
    eliminandoId = null;
}

function confirmarEliminar() {
    if (eliminandoId === null) return;
    var nuevos = [];
    for (var i = 0; i < clientes.length; i++) {
        if (clientes[i].id !== eliminandoId) {
            nuevos.push(clientes[i]);
        }
    }
    clientes = nuevos;
    cerrarModalEliminar();
    buscarCliente();
}

// Cerrar modales al hacer clic fuera
document.addEventListener('click', function(e) {
    var modalCliente = document.getElementById('modal-cliente');
    var modalEliminar = document.getElementById('modal-eliminar');
    if (modalCliente && e.target === modalCliente) cerrarModal();
    if (modalEliminar && e.target === modalEliminar) cerrarModalEliminar();
});

// Inicializar tabla de clientes si existe el contenedor
if (document.getElementById('cuerpo-tabla')) {
    renderTabla(clientes);
}

// Toggle del panel de administración de clientes
var panelAbierto = true;
function togglePanel() {
    var contenido = document.getElementById('contenido-panel');
    var btn = document.getElementById('btn-toggle-panel');
    if (!contenido || !btn) return;
    if (panelAbierto) {
        contenido.style.display = 'none';
        btn.innerHTML = '▼ Expandir';
        panelAbierto = false;
    } else {
        contenido.style.display = 'block';
        btn.innerHTML = '▲ Colapsar';
        panelAbierto = true;
    }
}
