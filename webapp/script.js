// Inicializa la Web App de Telegram
const tg = window.Telegram.WebApp;
tg.ready(); // Indica que la Web App está lista

// Obtiene referencias a los elementos del DOM
const scanButton = document.getElementById('scan-qr-button');
const qrResultDiv = document.getElementById('qr-result');

// Verifica si el botón existe antes de añadir el listener
if (scanButton) {
    scanButton.addEventListener('click', () => {
        // Muestra el escáner QR nativo de Telegram
        tg.showScanQrPopup({ text: "Apunta al QR del producto" }, (result) => {
            // Esta función callback se ejecuta cuando se escanea un QR
            if (result) {
                qrResultDiv.textContent = `QR Escaneado: ${result}`;
                // Aquí podrías enviar el 'result' de vuelta al bot si fuera necesario
                // usando tg.sendData(result);
                // Por ahora, solo lo mostramos en la Web App.
                tg.closeScanQrPopup(); // Cierra el popup del escáner
                return true; // Indica que el QR fue manejado
            } else {
                qrResultDiv.textContent = 'Escaneo cancelado o fallido.';
                 // No cerramos el popup aquí, Telegram lo maneja
                return false; // Indica que el QR no fue manejado (opcional)
            }
        });
    });
} else {
    console.error("El botón con id 'scan-qr-button' no fue encontrado.");
    qrResultDiv.textContent = "Error: No se encontró el botón de escaneo.";
}

// Opcional: Cambia el color de la barra de estado (si la plataforma lo soporta)
tg.setHeaderColor('#007bff'); // Un azul ejemplo

// Opcional: Habilita el botón de cierre de la Web App
tg.BackButton.show();
tg.BackButton.onClick(() => {
    // Puedes añadir lógica aquí antes de cerrar si es necesario
    tg.close();
}); 