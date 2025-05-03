// Inicializa la Web App de Telegram
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // Expande la Web App al máximo

// Estado de la aplicación
let cart = [];
let html5QrcodeScanner;
let lastProcessedCode = null; // Para debouncing
let lastProcessedTime = 0;    // Para debouncing
const SCAN_DEBOUNCE_MS = 5000; // Milisegundos de espera para el estaneo 5 segundos
// Referencias a elementos del DOM
const qrResultDiv = document.getElementById('qr-result');
const readerDiv = document.getElementById('reader');
const itemListUl = document.getElementById('item-list');
const manualBarcodeInput = document.getElementById('manual-barcode');
const manualQuantityInput = document.getElementById('manual-quantity');
const manualAddButton = document.getElementById('manual-add-button');
const finalizeButton = document.getElementById('finalize-button');

// --- Funciones Auxiliares ---

function playSound() {
    const beepElement = document.getElementById('scan-beep');
    if (beepElement) {
        // Asegura volumen máximo y rebobina
        beepElement.volume = 1.0; // Establece volumen al máximo (rango 0.0 a 1.0)
        beepElement.currentTime = 0;
        beepElement.play().catch(error => {
            // El navegador podría bloquear la reproducción si no hubo interacción previa
            console.warn("Fallo al reproducir sonido (puede requerir interacción del usuario):");
            // Podríamos intentar desbloquearlo en la primera interacción, pero
            // para el escaneo es más difícil asegurar eso.
        });
    } else {
        console.warn("Elemento de audio #scan-beep no encontrado.");
    }
}

function vibrateDevice() {
    if ('vibrate' in navigator) {
        navigator.vibrate(1000); // Vibra por 100ms
    }
}

function renderCart() {
    itemListUl.innerHTML = '';
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
            </div>
            <div class="item-quantity-controls">
                <button class="quantity-change-button" data-index="${index}" data-action="decrement">-</button>
                <input type="number" class="quantity-input" data-index="${index}" value="${item.quantity}" min="0.01" step="any"> 
                <button class="quantity-change-button" data-index="${index}" data-action="increment">+</button>
            </div>
            <button class="remove-item-button" data-index="${index}">X</button>
        `;
        
        li.querySelectorAll('.quantity-change-button').forEach(button => {
            button.addEventListener('click', handleQuantityChangeButtonClick);
        });
        li.querySelector('.quantity-input').addEventListener('change', handleQuantityInputChange);
        li.querySelector('.quantity-input').addEventListener('blur', handleQuantityInputChange);
        li.querySelector('.remove-item-button').addEventListener('click', handleRemoveItemClick);
        
        itemListUl.appendChild(li);
    });

    tg.MainButton.setText(`Finalizar Venta (${cart.length} items)`);
    tg.MainButton.show();
}

function handleQuantityChangeButtonClick(event) {
    const index = parseInt(event.target.dataset.index, 10);
    const action = event.target.dataset.action;
    if (action === 'increment') {
        incrementQuantity(index);
    } else if (action === 'decrement') {
        decrementQuantity(index);
    }
}

function handleQuantityInputChange(event) {
    const index = parseInt(event.target.dataset.index, 10);
    const newQuantity = parseFloat(event.target.value);
    updateQuantity(index, newQuantity);
}

function handleRemoveItemClick(event) {
    const index = parseInt(event.target.dataset.index, 10);
    removeItem(index);
}

function addItemOrIncrement(barcode) {
    const existingItemIndex = cart.findIndex(item => item.barcode === barcode);
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
        qrResultDiv.textContent = `+1 ${barcode} (Total: ${cart[existingItemIndex].quantity})`;
    } else {
        cart.push({ barcode, quantity: 1 });
        qrResultDiv.textContent = `Añadido: ${barcode} (x1)`;
    }
    renderCart();
}

function incrementQuantity(index) {
    if (cart[index]) {
        cart[index].quantity += 1;
        renderCart();
    }
}

function decrementQuantity(index) {
    if (cart[index]) {
        cart[index].quantity -= 1;
        if (cart[index].quantity <= 0) {
            removeItem(index);
        } else {
            renderCart();
        }
    }
}

function updateQuantity(index, newQuantity) {
    if (cart[index] && !isNaN(newQuantity) && newQuantity > 0) {
        cart[index].quantity = newQuantity;
    } else if (cart[index] && (!isNaN(newQuantity) && newQuantity <= 0)) {
        removeItem(index);
    } else {
        renderCart();
    }
}

function removeItem(index) {
    cart.splice(index, 1);
    renderCart();
    qrResultDiv.textContent = 'Item eliminado.';
}

// --- Lógica del Escáner --- 
const onScanSuccess = (decodedText, decodedResult) => {
    const currentTime = Date.now();

    // Lógica de Debouncing:
    // Ignora si es el mismo código y no ha pasado suficiente tiempo
    if (decodedText === lastProcessedCode && (currentTime - lastProcessedTime < SCAN_DEBOUNCE_MS)) {
        // console.log("Debounced same code:", decodedText); // Para depuración
        return; // Ignorar este escaneo repetido
    }

    // Si es un código nuevo o ha pasado el tiempo, procesarlo
    console.log(`Código detectado y procesado: ${decodedText}`);
    
    // Actualizar estado para debouncing ANTES de operaciones
    lastProcessedCode = decodedText;
    lastProcessedTime = currentTime;
    
    // Realizar acciones
    playSound();
    vibrateDevice();
    addItemOrIncrement(decodedText);
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
}

// --- Event Listeners --- 

manualAddButton.addEventListener('click', () => {
    const barcode = manualBarcodeInput.value.trim();
    const quantity = parseFloat(manualQuantityInput.value);

    if (barcode && !isNaN(quantity) && quantity > 0) {
        const existingItemIndex = cart.findIndex(item => item.barcode === barcode);
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({ barcode, quantity });
        }
        renderCart();
        manualBarcodeInput.value = '';
        manualQuantityInput.value = '1';
        qrResultDiv.textContent = `Añadido manualmente: ${barcode} (x${quantity})`;
    } else {
        alert('Entrada manual inválida.');
    }
});

finalizeButton.addEventListener('click', () => {
    if (cart.length > 0) {
        tg.sendData(JSON.stringify(cart));
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
if (readerDiv && qrResultDiv && itemListUl) {
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