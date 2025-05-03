// Inicializa la Web App de Telegram
const tg = window.Telegram.WebApp;
tg.ready(); // Indica que la Web App está lista

// Obtiene referencias a los elementos del DOM
const qrResultDiv = document.getElementById('qr-result');
const readerDiv = document.getElementById('reader');

// Verifica si los elementos necesarios existen
if (readerDiv && qrResultDiv) {

    // --- Configuración de html5-qrcode --- 
    const onScanSuccess = (decodedText, decodedResult) => {
        // Maneja el resultado del escaneo exitoso
        console.log(`Código detectado: ${decodedText}`, decodedResult);
        qrResultDiv.textContent = `Código detectado: ${decodedText}`;
        
        // Opcional: Detener el escáner después de un resultado exitoso
        // html5QrcodeScanner.clear().catch(error => {
        //     console.error("Fallo al limpiar el escáner.", error);
        // });

        // Opcional: Enviar datos al bot
        // tg.sendData(decodedText);

        // Opcional: Cerrar la Web App
        // tg.close();
    }

    const onScanFailure = (error) => {
        // Maneja errores de escaneo (puedes ignorar los comunes como "No QR code found")
        // console.warn(`Error de escaneo: ${error}`);
    }

    // Define los formatos de código de barras que quieres detectar
    // Puedes encontrar la lista completa en la documentación de html5-qrcode
    const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        // Html5QrcodeSupportedFormats.QR_CODE, // Puedes incluir QR si quieres también
        // ... otros formatos que necesites
    ];

    // Crea una instancia del escáner
    // El "true" al final indica que use verbose=true para logs detallados (útil para debug)
    const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", // ID del div contenedor
        {
            fps: 10, // Frames por segundo para escanear
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                // Define el tamaño del cuadro de escaneo (más pequeño es mejor a veces)
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdge * 0.7); // Usa el 70% del lado más corto
                return {
                    width: qrboxSize,
                    height: qrboxSize
                };
            },
            rememberLastUsedCamera: true, // Intenta usar la última cámara seleccionada
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA], // Solo usar cámara
            formatsToSupport: formatsToSupport
        },
        /* verbose= */ true);

    // Renderiza el escáner
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    // --- Fin configuración html5-qrcode ---

} else {
    console.error("Error: No se encontró el div 'reader' o 'qr-result'.");
    if (qrResultDiv) {
        qrResultDiv.textContent = "Error: No se pudo inicializar el escáner.";
    }
}

// Código anterior del botón que usaba tg.showScanQrPopup (eliminado)
/*
const scanButton = document.getElementById('scan-qr-button');
if (scanButton) {
    scanButton.addEventListener('click', () => {
        tg.showScanQrPopup({ text: "Apunta al QR del producto" }, (result) => {
            if (result) {
                qrResultDiv.textContent = `QR Escaneado: ${result}`;
                tg.closeScanQrPopup();
                return true;
            } else {
                qrResultDiv.textContent = 'Escaneo cancelado o fallido.';
                return false;
            }
        });
    });
} else {
    console.error("El botón con id 'scan-qr-button' no fue encontrado.");
    qrResultDiv.textContent = "Error: No se encontró el botón de escaneo.";
}
*/

// Opcional: Cambia el color de la barra de estado
tg.setHeaderColor('#28a745'); // Un verde ejemplo

// Opcional: Habilita el botón de cierre de la Web App
tg.BackButton.show();
tg.BackButton.onClick(() => {
    // Detener el escáner antes de cerrar para liberar la cámara
    if (typeof html5QrcodeScanner !== 'undefined' && html5QrcodeScanner.getState() === Html5QrcodeScannerState.SCANNING) {
        html5QrcodeScanner.clear().catch(error => {
            console.error("Fallo al limpiar el escáner al cerrar.", error);
        }).finally(() => {
             tg.close();
        });
    } else {
        tg.close();
    }
}); 