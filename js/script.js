// ==========================================
// CONFIGURACIÓN ENLACE BACKEND (APPS SCRIPT)
// ==========================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw5nZ-J7AS0zdsUthkxdJMUvKPBminUj4t5UYUKlKKVwNCI4VWa18iKC5BwV_RNoTW_/exec";

// Parámetros e Inyección de datos
const listaMotores = ["1030260", "1010230", "1010231", "1010232", "1010233", "1010234"];
const listaCantidades = Array.from({length: 50}, (_, i) => i + 1); // Rango 1 a 50

let usuarioLogueado = "";

// Inicialización General
lucide.createIcons();
buildWheels();

// Construir Ruedas tipo iOS con Scroll-Snap
function buildWheels() {
    setupWheelData('wheelOrigModelo', listaMotores);
    setupWheelData('wheelRealModelo', listaMotores);
    setupWheelData('wheelOrigCant', listaCantidades);
    setupWheelData('wheelRealCant', listaCantidades);
}

const btnRegresar = document.getElementById('btn-back');

if (usuarioLogueado === '') {
    btnRegresar.addEventListener('click', ()=> {
        switchScreen('screenLogin');
    });
}else {
    btnRegresar.addEventListener('click', ()=> {
        switchScreen('screenCapture');
    });
}

function setupWheelData(elementId, dataset) {
    const wheel = document.getElementById(elementId);
    const spaceHolders = wheel.querySelectorAll('.wheel-space-holder');
    
    dataset.forEach((val, index) => {
        const item = document.createElement('div');
        item.className = 'wheel-item';
        if(index === 0) item.classList.add('selected'); // Primero por defecto
        item.innerText = val;
        item.setAttribute('data-value', val);
        
        // Centrar con click si el usuario prefiere tocar directo en vez de arrastrar
        item.onclick = () => {
            wheel.scrollTo({ top: index * 40, behavior: 'smooth' });
        };

        wheel.insertBefore(item, spaceHolders[1]);
    });

    // Escuchar el evento de scroll para aplicar estilos dinámicos de selección (Foco central)
    wheel.addEventListener('scroll', () => {
        clearTimeout(wheel.scrollTimeout);
        wheel.scrollTimeout = setTimeout(() => {
            const scrollPos = wheel.scrollTop;
            const selectedIndex = Math.round(scrollPos / 40);
            
            const items = wheel.querySelectorAll('.wheel-item');
            items.forEach((item, idx) => {
                if(idx === selectedIndex) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }, 40);
    });
}

// Recuperar valores vigentes en el centro del carrusel
function getWheelValue(elementId) {
    const wheel = document.getElementById(elementId);
    const selectedItem = wheel.querySelector('.wheel-item.selected');
    return selectedItem ? selectedItem.getAttribute('data-value') : null;
}

// Navegación entre interfaces
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    if(screenId === 'screenLogin') {
        document.getElementById('inputGafete').focus();
        document.getElementById('userPill').style.display = 'none';
    } else if(screenId === 'screenCapture') {
        document.getElementById('inputOrden').focus();
    }
}

// --- MANEJO DE FLUJOS (LISTENERS) ---

// Simulación de paso automático por escaneo de Gafete
// --- MANEJO DE FLUJOS (CORRECCIÓN: LOGIN INSTANTÁNEO POR ESCANEO) ---

// Cambia de pantalla automáticamente en cuanto el lector de barras ingresa el texto
// Cambia de pantalla automáticamente en cuanto el lector de barras ingresa el texto
document.getElementById('inputGafete').addEventListener('input', function() {
    const badgeCode = this.value.trim();
    
    if (badgeCode.length > 0) {
        // Pequeño delay de 100ms para asegurar que el lector terminó de escribir todo el número completo
        setTimeout(() => {
            // CORRECCIÓN: Primero extraemos y guardamos el valor real del input
            usuarioLogueado = this.value.trim(); 
            
            // Después actualizamos la interfaz y limpiamos la caja de texto
            document.getElementById('txtOperador').innerText = `Op: ${usuarioLogueado}`;
            document.getElementById('userPill').style.display = 'flex';
            
            switchScreen('screenCapture'); // Redirección automática e inmediata
        }, 1000);
    }
});

// Previene cualquier conflicto o recarga si el lector tiene un 'Enter' automático al final
document.getElementById('inputGafete').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
});

// Enviar a Google Sheets
document.getElementById('btnGuardar').addEventListener('click', async function() {
    const ordenVal = document.getElementById('inputOrden').value.trim();
    
    if(!ordenVal) {
        alert("Por favor, escanee el código de barra de la orden de producción.");
        return;
    }

    const payload = {
        usuario: usuarioLogueado,
        orden: ordenVal,
        motorOriginal: getWheelValue('wheelOrigModelo'),
        cantOriginal: getWheelValue('wheelOrigCant'),
        motorReal: getWheelValue('wheelRealModelo'),
        cantReal: getWheelValue('wheelRealCant')
    };

    document.getElementById('btnGuardar').style.display = 'none';
    document.getElementById('loaderGuardar').style.display = 'block';

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        alert("Información sincronizada correctamente en Google Sheets.");
        
        // Limpieza del formulario
        document.getElementById('inputOrden').value = "";
        document.getElementById('wheelOrigModelo').scrollTo({top: 0});
        document.getElementById('wheelRealModelo').scrollTo({top: 0});
        document.getElementById('wheelOrigCant').scrollTo({top: 0});
        document.getElementById('wheelRealCant').scrollTo({top: 0});
        
        switchScreen('screenCapture');

    } catch(err) {
        alert("Ocurrió un error en el enlace con el servidor: " + err.message);
    } finally {
        document.getElementById('btnGuardar').style.display = 'flex';
        document.getElementById('loaderGuardar').style.display = 'none';
    }
});

// Trigger del Panel Admin
document.getElementById('btnIrExport').addEventListener('click', () => switchScreen('screenExport'));

// Descarga de datos
document.getElementById('btnDescargar').addEventListener('click', async function() {
    const pass = document.getElementById('exportPass').value.trim();
    const desde = document.getElementById('exportDesde').value;
    const hasta = document.getElementById('exportHasta').value;

    if(!pass || !desde || !hasta) {
        alert("Complete todos los campos obligatorios para la exportación.");
        return;
    }

    document.getElementById('btnDescargar').style.display = 'none';
    document.getElementById('loaderExport').style.display = 'block';

    const urlConsulta = `${WEB_APP_URL}?action=export&pass=${pass}&desde=${desde}&hasta=${hasta}`;

    try {
        const response = await fetch(urlConsulta);
        const queryResult = await response.json();

        if(queryResult.status === 'error') {
            alert("Autenticación fallida: " + queryResult.message);
        } else {
            let csvData = "\uFEFF"; // BOM para compatibilidad con caracteres especiales en Microsoft Excel
            csvData += queryResult.headers.join(",") + "\n";
            
            queryResult.data.forEach(row => {
                if(row[0]) row[0] = new Date(row[0]).toLocaleString(); // Formatear marca de tiempo
                csvData += row.join(",") + "\n";
            });

            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const blobUrl = URL.createObjectURL(blob);
            const dlLink = document.createElement("a");
            dlLink.setAttribute("href", blobUrl);
            dlLink.setAttribute("download", `Reporte_Produccion_Motores_${desde}_a_${hasta}.csv`);
            document.body.appendChild(dlLink);
            dlLink.click();
            document.body.removeChild(dlLink);

            document.getElementById('exportPass').value = "";
        }
    } catch(error) {
        alert("Error de comunicación: " + error.message);
    } finally {
        document.getElementById('btnDescargar').style.display = 'flex';
        document.getElementById('loaderExport').style.display = 'none';
    }
});