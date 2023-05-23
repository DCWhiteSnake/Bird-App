document.addEventListener("DOMContentLoaded", () => { 
  const socket = io("http://localhost:8000");
  socket.on('server-client', msg => {
    console.log(msg);
    socket.emit('client-server', 'Client: Alright!');
    });
});