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
  console.error('[POLLING ERROR]', error.code, error.message || error); // Log más detallado
});

// --- Listener para mensajes de texto normales ---
bot.on('message', (msg) => {
  // Ignorar si tiene web_app_data (se maneja en otro listener)
  // O si es el comando /start (ya manejado)
  if (msg.web_app_data || (msg.text && msg.text.startsWith('/start'))) {
    return;
  }

  // Log del objeto msg COMPLETO para mensajes de texto
  console.log("[BOT MSG]:", JSON.stringify(msg, null, 2)); 
  const chatId = msg.chat.id;

  if (msg.text) {
     console.log(`[BOT MSG LOG] Mensaje de texto recibido de ${chatId}: ${msg.text}`);
     // bot.sendMessage(chatId, 'Texto recibido: ' + msg.text); // Respuesta opcional
  }
});

// --- Listener DEDICADO para Web App Data ---
bot.on('web_app_data', (query) => {
  console.log("\n--- [BOT WEB_APP_DATA RECEIVED] ---");
  console.log(JSON.stringify(query, null, 2)); // Log del objeto query completo
  console.log("--- [END BOT WEB_APP_DATA] ---\n");

  const chatId = query.from.id; // El ID del usuario que envió los datos
  const dataString = query.data;
  console.log(`[BOT WAD LOG] Datos recibidos (raw string) para chat ${chatId}:`, dataString); // LOG 2

  try {
    console.log("[BOT WAD LOG] Intentando parsear JSON..."); // LOG 3
    const cartData = JSON.parse(dataString);
    console.log("[BOT WAD LOG] JSON parseado exitosamente:", cartData); // LOG 4

    let totalItems = 0;
    let messageText = "Venta registrada:\n"; 
    
    if (Array.isArray(cartData)) {
        console.log("[BOT WAD LOG] Procesando array del carrito..."); // LOG 5
        cartData.forEach(item => {
            const quantity = Number(item.quantity) || 0;
            totalItems += quantity;
            messageText += `- Código: ${item.barcode}, Cantidad: ${item.quantity}\n`; 
        });
        messageText += `\nTotal de productos: ${totalItems}`;
        console.log("[BOT WAD LOG] Mensaje de confirmación preparado:", messageText); // LOG 6
    } else {
        messageText = "Datos recibidos, pero formato incorrecto.";
        console.error("[BOT WAD ERROR] Los datos recibidos no son un array:", cartData);
    }

    console.log("[BOT WAD LOG] Enviando mensaje de confirmación al chat..."); // LOG 7
    // ¡Importante! Usamos el chatId obtenido de query.from.id
    bot.sendMessage(chatId, messageText);
    console.log("[BOT WAD LOG] Mensaje de confirmación enviado."); // LOG 8

  } catch (error) {
      console.error("[BOT WAD ERROR] Error al parsear o procesar datos de la Web App:", error); // LOG ERROR
      bot.sendMessage(chatId, "Hubo un error al procesar tu lista de compra.");
  }
});

console.log('Bot (re)iniciado con listener \'web_app_data\' y \'message\'...'); 