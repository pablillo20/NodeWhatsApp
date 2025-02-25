// Importación de dependencias necesarias
const express = require('express');  
const port = 3000;  
const { Server } = require('socket.io');  
const { createServer } = require('node:http');  
const path = require('path');  


const app = express();
const server = createServer(app);
const io = new Server(server);

// Lista para almacenar los usuarios conectados
let usuariosConectados = [];

// Definimos la ruta principal que responde con el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html')); 
  console.log("Me están pidiendo la página principal");  
});

// Definimos la ruta para los archivos (CSS, JS, imágenes, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Establecemos el comportamiento cuando un usuario se conecta 
io.on('connection', (socket) => {
  console.log('Nuevo usuario conectado');  

  // Cuando un usuario se identifica (envía su nombre, estado y perfil)
  socket.on('identificacion', (datos) => {
    // Guardamos los datos del usuario en la lista de usuarios conectados
    usuariosConectados.push({ id: socket.id, nombre: datos.nombre, estado: datos.estado, perfil: datos.perfil });
    console.log(`Usuario ${datos.nombre} se ha conectado`); 

    // Emitimos la lista de usuarios conectados a todos los clientes
    io.emit('usuariosConectados', usuariosConectados);

    // Enviamos una notificación a todos los usuarios para anunciar que alguien se ha conectado
    io.emit('mostrarNotificacion', `${datos.nombre} ha entrado al chat.`);
  });

  // Cuando un usuario envía un mensaje
  socket.on('mensaje', (datos) => {
    console.log("Recibo mensaje de " + datos.nombre + ": " + datos.mensaje);  
    io.emit("nuevoMensaje", datos);
  });

  // Cuando un usuario envía una imagen
  socket.on('mensajeImagen', (datos) => {
    console.log("Recibo imagen de " + datos.nombre + ": " + datos.mensaje);
    io.emit("nuevoMensajeImagen", datos);
  });

  // Cuando un usuario empieza a escribir
  socket.on('escribiendo', (nombre) => {
    socket.broadcast.emit('usuarioEscribiendo', nombre);
  });

  // Cuando un usuario se desconecta
  socket.on('disconnect', () => {
    let usuario = usuariosConectados.find(u => u.id === socket.id);  // Buscamos al usuario que se ha desconectado
    if (usuario) {
      // Eliminamos al usuario de la lista de usuarios conectados
      usuariosConectados = usuariosConectados.filter(u => u.id !== socket.id);
      console.log(`Usuario ${usuario.nombre} se ha desconectado`);  

      // Emitimos la lista de usuarios actualizada a todos los clientes
      io.emit('usuariosConectados', usuariosConectados);

      // Enviamos una notificación de desconexión a todos los usuarios
      io.emit('mostrarNotificacion', `${usuario.nombre} se ha desconectado.`);
    }
  });
});

// El servidor empieza a escuchar en el puerto 3000
server.listen(port, () => {
  console.log(`Server escuchando en el puerto ${port}`);  
});
