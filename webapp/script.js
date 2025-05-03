// Inicializa la Web App de Telegram
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // Expande la Web App al máximo

// Estado de la aplicación
let cart = [];
let html5QrcodeScanner;
let isScannerPaused = false;
let lastScannedCode = null;

// Referencias a elementos del DOM
const qrResultDiv = document.getElementById('qr-result');
const readerDiv = document.getElementById('reader');
const itemListUl = document.getElementById('item-list');
const quantityPromptDiv = document.getElementById('quantity-prompt');
const scannedCodeSpan = document.getElementById('scanned-code');
const quantityInput = document.getElementById('quantity-input');
const confirmQuantityButton = document.getElementById('confirm-quantity');
const cancelQuantityButton = document.getElementById('cancel-quantity');
const restartScanButton = document.getElementById('restart-scan-button');
const manualBarcodeInput = document.getElementById('manual-barcode');
const manualQuantityInput = document.getElementById('manual-quantity');
const manualAddButton = document.getElementById('manual-add-button');
const finalizeButton = document.getElementById('finalize-button');

// --- Funciones Auxiliares ---

function playSound() {
    // Simple beep - necesita permiso del usuario en algunos navegadores
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine'; // 'sine', 'square', 'sawtooth', 'triangle'
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
        console.warn("No se pudo reproducir el sonido:", e);
    }
}

function vibrateDevice() {
    if ('vibrate' in navigator) {
        navigator.vibrate(100); // Vibra por 100ms
    }
}

function renderCart() {
    itemListUl.innerHTML = ''; // Limpia la lista actual
    if (cart.length === 0) {
        itemListUl.innerHTML = '<li>Lista vacía</li>';
        tg.MainButton.hide();
        return;
    }
    cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-details">
                <span class="barcode">${item.barcode}</span>
                <span class="quantity">Cantidad: ${item.quantity}</span>
            </div>
            <button class="remove-item-button" data-index="${index}">X</button>
        `;
        li.querySelector('.remove-item-button').addEventListener('click', () => {
            removeItem(index);
        });
        itemListUl.appendChild(li);
    });

    // Actualizar y mostrar botón principal de Telegram para finalizar
    tg.MainButton.setText(`Finalizar Venta (${cart.length} items)`);
    tg.MainButton.show();
}

function addItemToCart(barcode, quantity) {
    // Opcional: Buscar si el item ya existe y sumar cantidad?
    // Por ahora, simplemente añade
    cart.push({ barcode, quantity });
    renderCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    renderCart();
}

function showQuantityPrompt(code) {
    lastScannedCode = code;
    scannedCodeSpan.textContent = code;
    quantityInput.value = 1; // Resetea a 1
    quantityPromptDiv.style.display = 'block';
    qrResultDiv.textContent = `Código ${code} detectado. Introduce cantidad.`;
    quantityInput.focus();
    restartScanButton.style.display = 'block'; // Mostrar botón para re-escanear
}

function hideQuantityPrompt() {
    quantityPromptDiv.style.display = 'none';
    lastScannedCode = null;
}

function restartScanner() {
    if (html5QrcodeScanner && isScannerPaused) {
        html5QrcodeScanner.resume();
        isScannerPaused = false;
        qrResultDiv.textContent = 'Escáner reactivado.';
        restartScanButton.style.display = 'none'; // Ocultar botón
        hideQuantityPrompt(); // Ocultar prompt si estaba visible
    }
}

// --- Lógica del Escáner --- 
const onScanSuccess = (decodedText, decodedResult) => {
    if (isScannerPaused) return; // Ignorar si ya estamos pausados esperando cantidad

    console.log(`Código detectado: ${decodedText}`, decodedResult);
    playSound();
    vibrateDevice();

    // Pausar el escáner para pedir cantidad
    html5QrcodeScanner.pause(true); // El 'true' limpia el viewfinder
    isScannerPaused = true;

    showQuantityPrompt(decodedText);
}

const onScanFailure = (error) => {
    // Ignorar errores comunes como que no se encontró código
}

function initializeScanner() {
    const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
    ];

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                 const desiredWidth = Math.floor(viewfinderWidth * 0.85);
                 const desiredHeight = Math.floor(viewfinderHeight * 0.3);
                 const width = Math.min(desiredWidth, viewfinderWidth);
                 const height = Math.min(desiredHeight, viewfinderHeight);
                 return { width: width, height: height };
            },
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            formatsToSupport: formatsToSupport
        },
        false); // verbose=false para menos logs

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    qrResultDiv.textContent = 'Escáner inicializado. Apunta al código.';
    isScannerPaused = false;
}

// --- Event Listeners --- 

confirmQuantityButton.addEventListener('click', () => {
    const quantity = parseInt(quantityInput.value, 10);
    if (lastScannedCode && quantity > 0) {
        addItemToCart(lastScannedCode, quantity);
        hideQuantityPrompt();
        // Decidimos si reiniciar automáticamente o esperar al botón
        // restartScanner(); // Opcional: reiniciar automáticamente
        qrResultDiv.textContent = `Añadido: ${lastScannedCode} (x${quantity}). Escanea el siguiente.`;
    } else {
        alert('Cantidad inválida.');
    }
});

cancelQuantityButton.addEventListener('click', () => {
    hideQuantityPrompt();
    restartScanner(); // Si cancela, reinicia el escáner
    qrResultDiv.textContent = 'Escaneo cancelado. Escanea el siguiente.';
});

restartScanButton.addEventListener('click', () => {
    restartScanner();
});

manualAddButton.addEventListener('click', () => {
    const barcode = manualBarcodeInput.value.trim();
    const quantity = parseInt(manualQuantityInput.value, 10);

    if (barcode && quantity > 0) {
        addItemToCart(barcode, quantity);
        manualBarcodeInput.value = ''; // Limpiar campos
        manualQuantityInput.value = '1';
    } else {
        alert('Por favor, introduce un código y cantidad válidos.');
    }
});

finalizeButton.addEventListener('click', () => {
    if (cart.length > 0) {
        // Enviar datos al bot
        tg.sendData(JSON.stringify(cart));
        // Opcionalmente cerrar la webapp después
        // tg.close(); 
    } else {
        alert('La lista está vacía.');
    }
});

// Listener para el botón principal de Telegram
tg.MainButton.onClick(() => {
     if (cart.length > 0) {
        tg.sendData(JSON.stringify(cart));
    } 
});

// --- Inicialización --- 

// Verifica si los elementos necesarios existen antes de inicializar
if (readerDiv && qrResultDiv && itemListUl && quantityPromptDiv) {
    try {
        initializeScanner();
    } catch (error) {
        console.error("Error inicializando el escáner:", error);
        qrResultDiv.textContent = "Error al iniciar el escáner. Asegúrate de dar permiso a la cámara.";
    }
    renderCart(); // Renderiza la lista inicial (vacía)
} else {
    console.error("Error: Faltan elementos esenciales del DOM.");
    if(qrResultDiv) qrResultDiv.textContent = "Error crítico: Faltan elementos HTML.";
}

// Botón de retroceso de Telegram
tg.BackButton.show();
tg.BackButton.onClick(() => {
    if (html5QrcodeScanner && html5QrcodeScanner.getState() === Html5QrcodeScannerState.SCANNING) {
        html5QrcodeScanner.clear().catch(error => {
            console.error("Fallo al limpiar el escáner al cerrar.", error);
        }).finally(() => tg.close());
    } else {
        // Si está pausado, intenta detenerlo también
         try {
             if (html5QrcodeScanner) {
                 html5QrcodeScanner.clear().finally(() => tg.close());
             } else {
                 tg.close();
             }
         } catch(e) {
             console.error("Error al limpiar escáner pausado:", e);
             tg.close();
         }
    }
});

// Opcional: Cambia el color de la barra de estado
tg.setHeaderColor('#563d7c'); // Un morado ejemplo 