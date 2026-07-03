from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import json
import os
import random
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = 'clave_secreta_para_sesiones_abarrotes_flor'

USUARIO_CORRECTO = "alex@123"
CONTRASENA_CORRECTA = "alex123"

clientes_registrados = []
registro_contador = [1]

PRODUCTOS_ARCHIVO = "productos.json"

def cargar_productos():
    if not os.path.exists(PRODUCTOS_ARCHIVO):
        productos_ejemplo = [
            {"id": 1, "nombre": "Manzana", "descripcion": "Manzanas rojas dulces", "precio": 3.50, "imagen": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTefUHgejxyLcdttT_ovpNnkWpHNzXHDsN9RQ&s", "fecha_creacion": datetime.now().strftime("%Y-%m-%d")},
            {"id": 2, "nombre": "Plátano", "descripcion": "Plátanos de seda", "precio": 2.00, "imagen": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStP3GhAe2hFpPDHhYRSFers5V2xidAaDkUJw&s", "fecha_creacion": datetime.now().strftime("%Y-%m-%d")},
            {"id": 3, "nombre": "Leche Entera", "descripcion": "Leche pasteurizada", "precio": 4.20, "imagen": "https://media.falabella.com/tottusPE/43548139_1/w=1500,h=1500,fit=cover", "fecha_creacion": datetime.now().strftime("%Y-%m-%d")}
        ]
        guardar_productos(productos_ejemplo)
        return productos_ejemplo
    with open(PRODUCTOS_ARCHIVO, "r", encoding="utf-8") as f:
        contenido = f.read().strip()
        if not contenido:
            productos_ejemplo = [
                {"id": 1, "nombre": "Manzana", "descripcion": "Manzanas rojas dulces", "precio": 3.50, "imagen": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTefUHgejxyLcdttT_ovpNnkWpHNzXHDsN9RQ&s", "fecha_creacion": datetime.now().strftime("%Y-%m-%d")},
                {"id": 2, "nombre": "Plátano", "descripcion": "Plátanos de seda", "precio": 2.00, "imagen": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStP3GhAe2hFpPDHhYRSFers5V2xidAaDkUJw&s", "fecha_creacion": datetime.now().strftime("%Y-%m-%d")},
                {"id": 3, "nombre": "Leche Entera", "descripcion": "Leche pasteurizada", "precio": 4.20, "imagen": "https://media.falabella.com/tottusPE/43548139_1/w=1500,h=1500,fit=cover", "fecha_creacion": datetime.now().strftime("%Y-%m-%d")}
            ]
            guardar_productos(productos_ejemplo)
            return productos_ejemplo
        f.seek(0)
        return json.load(f)

def guardar_productos(productos):
    with open(PRODUCTOS_ARCHIVO, "w", encoding="utf-8") as f:
        json.dump(productos, f, indent=2, ensure_ascii=False)

VENTAS_ARCHIVO = "ventas.json"

def cargar_ventas():
    if not os.path.exists(VENTAS_ARCHIVO):
        return []
    with open(VENTAS_ARCHIVO, "r", encoding="utf-8") as f:
        contenido = f.read().strip()
        if not contenido:
            return []
        f.seek(0)
        return json.load(f)

def guardar_ventas(ventas):
    with open(VENTAS_ARCHIVO, "w", encoding="utf-8") as f:
        json.dump(ventas, f, indent=2, ensure_ascii=False)


@app.route("/registrarse", methods=["GET", "POST"])
def registrarse():
    mensaje_ok = ""
    mensaje_error = ""
    if request.method == "POST":
        nombre = request.form.get("nombre", "").strip()
        email = request.form.get("email", "").strip()
        telefono = request.form.get("telefono", "").strip()
        direccion = request.form.get("direccion", "").strip()
        if not nombre or not email or not telefono:
            mensaje_error = "Por favor completa los campos obligatorios (*)."
        else:
            nuevo = {
                "id": registro_contador[0],
                "nombre": nombre,
                "email": email,
                "telefono": telefono,
                "direccion": direccion if direccion else "—",
                "fecha_registro": datetime.now().strftime("%Y-%m-%d")
            }
            clientes_registrados.append(nuevo)
            registro_contador[0] += 1
            mensaje_ok = f"¡Registro exitoso! Bienvenido/a, {nombre}."
    return render_template("registrarse.html", mensaje_ok=mensaje_ok, mensaje_error=mensaje_error)

@app.route("/", methods=["GET", "POST"])
def pagina():
    usuario_autenticado = session.get("autenticado", False)
    mensaje_error = ""
    productos_dinamicos = cargar_productos()

    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        if email == USUARIO_CORRECTO and password == CONTRASENA_CORRECTA:
            session["autenticado"] = True
            usuario_autenticado = True
        else:
            mensaje_error = "Credenciales incorrectas. Inténtalo nuevamente."

    return render_template("index.html",
                           usuario_autenticado=usuario_autenticado,
                           mensaje_error=mensaje_error,
                           clientes_registrados=clientes_registrados,
                           productos_dinamicos=productos_dinamicos)

@app.route("/finalizar_compra", methods=["POST"])
def finalizar_compra():
    data = request.get_json()
    nombre = data.get("cliente", "").strip()
    telefono = data.get("telefono", "").strip()
    total = data.get("total")
    items = data.get("items", [])
    if not nombre or not telefono:
        return {"error": "Nombre y teléfono son obligatorios"}, 400
    if not total or not items:
        return {"error": "El carrito está vacío"}, 400
    ventas = cargar_ventas()
    nuevo_id = max([v["id"] for v in ventas], default=0) + 1
    ventas.append({
        "id": nuevo_id,
        "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "cliente": nombre,
        "telefono": telefono,
        "total": round(total, 2),
        "items": items
    })
    guardar_ventas(ventas)
    return {"status": "ok", "message": f"¡Gracias {nombre}! Tu compra fue registrada."}

@app.route("/dashboard")
def dashboard():
    if not session.get("autenticado"):
        return redirect(url_for("pagina"))
    
    total_clientes = len(clientes_registrados)
    productos = cargar_productos()
    total_productos_dinamicos = len(productos)
    total_productos_estaticos = 60
    total_productos = total_productos_estaticos + total_productos_dinamicos
    precio_promedio = sum(p["precio"] for p in productos) / len(productos) if productos else 0.0

    ventas = cargar_ventas()
    hoy = datetime.now()
    mes_actual = hoy.month
    anio_actual = hoy.year
    ventas_mes = sum(v["total"] for v in ventas if v["fecha"].startswith(f"{anio_actual}-{mes_actual:02d}"))

    ventas_diarias = []
    for i in range(6, -1, -1):
        fecha_str = (hoy - timedelta(days=i)).strftime("%Y-%m-%d")
        total_dia = sum(v["total"] for v in ventas if v["fecha"].startswith(fecha_str))
        ventas_diarias.append(round(total_dia, 2))

    dias = [(hoy - timedelta(days=i)).strftime("%d/%m") for i in range(6, -1, -1)]

    
    nuevos_clientes_linea = []
    for i in range(6, -1, -1):
        fecha_str = (hoy - timedelta(days=i)).strftime("%Y-%m-%d")
        count = sum(1 for c in clientes_registrados if c.get("fecha_registro") == fecha_str)
        nuevos_clientes_linea.append(count)

    nuevos_productos_linea = []
    for i in range(6, -1, -1):
        fecha_str = (hoy - timedelta(days=i)).strftime("%Y-%m-%d")
        count = sum(1 for p in productos if p.get("fecha_creacion") == fecha_str)
        nuevos_productos_linea.append(count)


    ultimos_clientes = clientes_registrados[-5:] if clientes_registrados else []
    ultimos_productos = sorted(productos, key=lambda x: x['id'], reverse=True)[:5] if productos else []
    hora_actual = datetime.now().strftime("%H:%M:%S")
    variacion_productos = int(total_productos * 0.1)

    dias_json = json.dumps(dias)
    ventas_diarias_json = json.dumps(ventas_diarias)
    nuevos_clientes_json = json.dumps(nuevos_clientes_linea)
    nuevos_productos_json = json.dumps(nuevos_productos_linea)

    return render_template("dashboard.html",
                           usuario_autenticado=True,
                           total_productos=total_productos,
                           precio_promedio=precio_promedio,
                           total_clientes=total_clientes,
                           ventas_mes=ventas_mes,
                           variacion_productos=variacion_productos,
                           hora_actual=hora_actual,
                           ultimos_clientes=ultimos_clientes,
                           ultimos_productos=ultimos_productos,
                           dias_json=dias_json,
                           ventas_diarias_json=ventas_diarias_json,
                           nuevos_clientes_json=nuevos_clientes_json,
                           nuevos_productos_json=nuevos_productos_json)

@app.route("/admin/productos")
def admin_productos():
    if not session.get("autenticado"):
        return redirect(url_for("pagina"))
    productos = cargar_productos()
    return render_template("admin_productos.html", productos=productos)

@app.route("/admin/productos/agregar", methods=["GET", "POST"])
def agregar_producto():
    if not session.get("autenticado"):
        return redirect(url_for("pagina"))
    if request.method == "POST":
        nombre = request.form.get("nombre", "").strip()
        descripcion = request.form.get("descripcion", "").strip()
        precio = request.form.get("precio", "").strip()
        imagen = request.form.get("imagen", "").strip()
        
        if not nombre or not precio:
            return "Error: nombre y precio son obligatorios", 400
        try:
            precio = float(precio)
        except:
            return "Error: precio debe ser un número", 400
        
        productos = cargar_productos()
        nuevo_id = max([p["id"] for p in productos], default=0) + 1
        productos.append({
            "id": nuevo_id,
            "nombre": nombre,
            "descripcion": descripcion,
            "precio": precio,
            "imagen": imagen if imagen else "https://via.placeholder.com/150",
            "fecha_creacion": datetime.now().strftime("%Y-%m-%d")  # <--- AGREGADO
        })
        guardar_productos(productos)
        return redirect(url_for("admin_productos"))
    return render_template("producto_form.html", producto=None, titulo="Agregar Producto")

@app.route("/admin/productos/editar/<int:id>", methods=["GET", "POST"])
def editar_producto(id):
    if not session.get("autenticado"):
        return redirect(url_for("pagina"))
    productos = cargar_productos()
    producto = next((p for p in productos if p["id"] == id), None)
    if not producto:
        return "Producto no encontrado", 404
    if request.method == "POST":
        producto["nombre"] = request.form.get("nombre", "").strip()
        producto["descripcion"] = request.form.get("descripcion", "").strip()
        try:
            producto["precio"] = float(request.form.get("precio", 0))
        except:
            pass
        producto["imagen"] = request.form.get("imagen", "").strip()
        guardar_productos(productos)
        return redirect(url_for("admin_productos"))
    return render_template("producto_form.html", producto=producto, titulo="Editar Producto")

@app.route("/admin/productos/eliminar/<int:id>")
def eliminar_producto(id):
    if not session.get("autenticado"):
        return redirect(url_for("pagina"))
    productos = cargar_productos()
    productos = [p for p in productos if p["id"] != id]
    guardar_productos(productos)
    return redirect(url_for("admin_productos"))

@app.route("/logout")
def logout():
    session.pop("autenticado", None)
    return redirect(url_for("pagina"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
