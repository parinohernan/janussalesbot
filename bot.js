const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Reemplaza con tu token real obtenido de BotFather
const token = '7891827456:AAF2LXEvjCfdpWNwmI4sOu_rztODtmITyLk';
const port = 3300;

// ¡IMPORTANTE! Cambia esto por tu URL pública HTTPS de ngrok más adelante
// Ejemplo: const url = 'https://tu-dominio-ngrok.io';
const url = 'https://small-pillows-tie.loca.lt'; // Actualizado con la URL de localtunnel
// Usaremos una parte del token como path secreto para el webhook
// Esto NO es súper seguro para producción, pero sí para pruebas.
const secretPath = `/webhook/${token.substring(token.indexOf(':') + 1, token.indexOf(':') + 11)}`; // Ejemplo: /webhook/AAF2LXEvjC

// Crea el bot SIN polling
const bot = new TelegramBot(token);

// Crea la aplicación Express
const app = express();

// Middleware para parsear el cuerpo JSON de las peticiones de Telegram
app.use(express.json());

// URL de tu Web App (usaremos ngrok o similar para desarrollo local más adelante)
// Por ahora, podemos apuntar a un archivo local, pero Telegram requiere HTTPS
// para producción. Usaremos una URL temporal para probar.
// IMPORTANTE: Telegram requiere que la URL sea HTTPS.
// Para desarrollo local, usaremos una herramienta como ngrok.
// Por ahora, pondremos un placeholder. Necesitarás actualizar esto.
const webAppUrl = 'https://janussales.netlify.app/'; // <- Actualizado con la URL de Netlify

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

// --- Ruta POST para el Webhook ---
app.post(secretPath, (req, res) => {
  const update = req.body; // El objeto update viene en el cuerpo de la petición
  console.log("\n--- [BOT WEBHOOK RAW UPDATE RECEIVED] ---");
  console.log(JSON.stringify(update, null, 2));
  console.log("--- [END BOT WEBHOOK RAW UPDATE] ---\n");

  // Intentar procesar web_app_data desde la actualización
  if (update.message && update.message.web_app_data) {
    const msg = update.message; 
    const chatId = msg.chat.id; // Aquí usamos el chat.id del mensaje
    const userId = msg.from.id; // Y el ID del usuario
    console.log(`[BOT WEBHOOK LOG] web_app_data encontrado en update.message de usuario ${userId}.`); // LOG 1
    const dataString = msg.web_app_data.data;
    console.log(`[BOT WEBHOOK LOG] Datos recibidos (raw string) para chat ${chatId}:`, dataString); // LOG 2

    try {
      console.log("[BOT WEBHOOK LOG] Intentando parsear JSON..."); // LOG 3
      const cartData = JSON.parse(dataString);
      console.log("[BOT WEBHOOK LOG] JSON parseado exitosamente:", cartData); // LOG 4

      let totalItems = 0;
      let messageText = "Venta registrada (Webhook):\n"; 
      
      if (Array.isArray(cartData)) {
          console.log("[BOT WEBHOOK LOG] Procesando array del carrito..."); // LOG 5
          cartData.forEach(item => {
              const quantity = Number(item.quantity) || 0;
              totalItems += quantity;
              messageText += `- Código: ${item.barcode}, Cantidad: ${item.quantity}\n`; 
          });
          messageText += `\nTotal de productos: ${totalItems}`;
          console.log("[BOT WEBHOOK LOG] Mensaje de confirmación preparado:", messageText); // LOG 6
      } else {
          messageText = "Datos recibidos (Webhook), pero formato incorrecto.";
          console.error("[BOT WEBHOOK ERROR] Los datos recibidos no son un array:", cartData);
      }

      console.log("[BOT WEBHOOK LOG] Enviando mensaje de confirmación al chat..."); // LOG 7
      // Usamos el chatId del mensaje donde se originó la webapp
      bot.sendMessage(chatId, messageText);
      console.log("[BOT WEBHOOK LOG] Mensaje de confirmación enviado."); // LOG 8

    } catch (error) {
        console.error("[BOT WEBHOOK ERROR] Error al parsear o procesar datos:", error);
        bot.sendMessage(chatId, "Hubo un error al procesar tu lista (Webhook).");
    }
  } else {
      // console.log("[BOT WEBHOOK LOG] La actualización no contenía message.web_app_data.");
  }

  // Responder a Telegram que recibimos la actualización correctamente
  res.sendStatus(200);
});

// --- Verificación de Webhook al inicio (Temporal) --- // ELIMINADO
/*
bot.getWebhookInfo()
  .then(info => {
    console.log("\n--- [INFO WEBHOOK ACTUAL] ---");
    console.log(JSON.stringify(info, null, 2));
    console.log("--- [FIN INFO WEBHOOK] ---\n");
    // Comprobar si la URL coincide con la esperada
    const expectedUrl = `${url}${secretPath}`;
    if (info.url !== expectedUrl) {
      console.warn(`ADVERTENCIA: La URL del webhook registrada (${info.url || 'ninguna'}) NO coincide con la esperada (${expectedUrl}). ¡Es posible que necesites volver a registrarla!`);
    }
  })
  .catch(error => {
    console.error("Error al obtener información del webhook:", error);
  });
*/

// --- Configuración Inicial del Webhook (SOLO EJECUTAR UNA VEZ CON LA URL CORRECTA) ---
// DESCOMENTA ESTAS LÍNEAS SOLO CUANDO TENGAS TU URL NGROK/LOCALTUNNEL Y QUIERAS REGISTRARLA
/* <--- AÑADIR COMENTARIO
if (url === 'AQUI_VA_TU_URL_NGROK_HTTPS') { // Esta condición no se cumplirá, pero es seguro dejarla
  console.warn("ADVERTENCIA: La URL de webhook parece ser el placeholder. ¡Registrando de todas formas si no lo es!"); 
}
// La lógica original tenía un else, pero podemos intentar registrar siempre si url no es el placeholder
// Asegurarse que url NO es el placeholder antes de intentar
if (url && url !== 'AQUI_VA_TU_URL_NGROK_HTTPS') { 
  console.log(`Intentando registrar webhook en: ${url}${secretPath}`);
  bot.setWebhook(`${url}${secretPath}`)
    .then(success => {
      if (success) {
        console.log(`---> Webhook configurado exitosamente en ${url}${secretPath} <---`);
      } else {
        console.error('---> Error al configurar el webhook (API devolvió false) <---');
      }
    })
    .catch(error => {
      console.error('---> Error en la llamada a setWebhook: <---', error.response ? error.response.body : error);
    });
} else if (url === 'AQUI_VA_TU_URL_NGROK_HTTPS') {
    console.warn("---> ADVERTENCIA: No se registró webhook. Reemplaza 'AQUI_VA_TU_URL_NGROK_HTTPS' con tu URL pública. <---");
}
*/ // <--- AÑADIR COMENTARIO

// Iniciar el servidor Express
app.listen(port, () => {
  console.log(`Servidor Express escuchando en el puerto ${port}`);
  console.log(`Webhook esperado en la ruta: ${secretPath}`);
  console.log(`==> ¡IMPORTANTE! Necesitas ngrok para exponer el puerto ${port} y configurar la URL en Telegram.`);
  console.log(`==> Luego, descomenta y ejecuta el bloque bot.setWebhook() UNA SOLA VEZ con tu URL de ngrok.`);
}); 