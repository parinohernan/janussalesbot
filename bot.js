const TelegramBot = require('node-telegram-bot-api');

// Reemplaza con tu token real obtenido de BotFather
const token = '7891827456:AAF2LXEvjCfdpWNwmI4sOu_rztODtmITyLk';

// Crea una instancia del bot usando "polling" para obtener actualizaciones
const bot = new TelegramBot(token, { polling: true });

// URL de tu Web App (usaremos ngrok o similar para desarrollo local más adelante)
// Por ahora, podemos apuntar a un archivo local, pero Telegram requiere HTTPS
// para producción. Usaremos una URL temporal para probar.
// IMPORTANTE: Telegram requiere que la URL sea HTTPS.
// Para desarrollo local, usaremos una herramienta como ngrok.
// Por ahora, pondremos un placeholder. Necesitarás actualizar esto.
const webAppUrl = 'https://example.com'; // <- ¡Necesitarás reemplazar esto!

// Escucha el comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Envía un mensaje con un botón InlineKeyboard que abre la Web App
  bot.sendMessage(chatId, '¡Hola! Haz clic abajo para abrir el escáner QR.', {
    reply_markup: {
      // Define el teclado inline
      inline_keyboard: [
        // Array de filas de botones
        [
          // Primera fila con un botón
          {
            text: '📱 Abrir Escáner QR', // Texto del botón
            web_app: { url: webAppUrl } // Acción: abrir la Web App en la URL especificada
          }
        ]
      ]
    }
  });
});

console.log('Bot iniciado...');

// Manejo básico de errores de polling
bot.on('polling_error', (error) => {
  console.error('Error de polling:', error.code); // p. ej. 'EFATAL'
  // Puedes agregar lógica de reintento o notificación aquí si es necesario
});

// Escucha cualquier mensaje de texto (opcional, para depuración)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  // Solo responde si no es el comando /start para evitar doble respuesta
  if (msg.text && !msg.text.startsWith('/start')) {
    console.log(`Mensaje recibido de ${chatId}: ${msg.text}`);
    // bot.sendMessage(chatId, 'Recibí tu mensaje: ' + msg.text);
  }
}); 