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
const webAppUrl = 'https://4db1cec7-c666-445c-bf54-1998b05ccd0d.netlify.app/index.html'; // <- Actualizado con la URL de Netlify

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
  // Ignorar si contiene web_app_data, ya que se manejará en otro listener
  if (msg.web_app_data) return;

  const chatId = msg.chat.id;
  // Solo responde si no es el comando /start para evitar doble respuesta
  if (msg.text && !msg.text.startsWith('/start')) {
    console.log(`Mensaje recibido de ${chatId}: ${msg.text}`);
    // bot.sendMessage(chatId, 'Recibí tu mensaje: ' + msg.text);
  }
});

// --- NUEVO LISTENER: Manejar datos recibidos de la Web App ---
bot.on('message', (msg) => {
  // Verificar si el mensaje contiene datos de la Web App
  if (msg.web_app_data) {
    const chatId = msg.chat.id;
    const dataString = msg.web_app_data.data;
    console.log(`Datos recibidos de la Web App para chat ${chatId}:`, dataString);

    try {
      // Parsear el JSON string de vuelta a un objeto/array JavaScript
      const cartData = JSON.parse(dataString);

      // --- Aquí procesas los datos del carrito --- 
      // Por ejemplo, calcular el total de items o el precio si tuvieras precios
      let totalItems = 0;
      let messageText = "Venta registrada:\n";
      
      if (Array.isArray(cartData)) {
          cartData.forEach(item => {
              totalItems += item.quantity;
              // Formatear cada item para el mensaje
              messageText += `- Código: ${item.barcode}, Cantidad: ${item.quantity}\n`; 
          });
          messageText += `\nTotal de productos: ${totalItems}`;
      } else {
          messageText = "Se recibieron datos, pero el formato no es el esperado (no es un array).";
          console.error("Error: los datos recibidos no son un array:", cartData);
      }
      
      // Puedes añadir lógica para guardar en DB, etc.
      // --------------------------------------------

      // Enviar confirmación al usuario en Telegram
      bot.sendMessage(chatId, messageText);

    } catch (error) {
        console.error("Error al parsear o procesar datos de la Web App:", error);
        bot.sendMessage(chatId, "Hubo un error al procesar tu lista de compra. Por favor, inténtalo de nuevo.");
    }
  }
});

console.log('Bot (re)iniciado con listener para Web App Data...'); 