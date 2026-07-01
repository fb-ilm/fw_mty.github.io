// ==========================================
// CONFIGURACIÓN ENLACE BACKEND (APPS SCRIPT)
// ==========================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw5nZ-J7AS0zdsUthkxdJMUvKPBminUj4t5UYUKlKKVwNCI4VWa18iKC5BwV_RNoTW_/exec";

// Configuraciones del Nuevo Sistema de Motores
// Colores base: Negro (#1D1D1F), Gris (#86868B), Natural/Ivory (#D2B48C / #FFFFF0), Rojo (#FF3B30)
const configMotores = [
    { etiqueta: "B", pcn: "1030260 / 1010230", colores: ["#1D1D1F"] },
    { etiqueta: "BB", pcn: "1010230 / 1010230", colores: ["#1D1D1F", "#1D1D1F"] },
    { etiqueta: "BG", pcn: "1010230 / 1010231", colores: ["#1D1D1F", "#86868B"] },
    { etiqueta: "BI", pcn: "1010230 / 1010234", colores: ["#1D1D1F", "#FFFFF0"] },
    { etiqueta: "BN", pcn: "1010230 / 1010233", colores: ["#1D1D1F", "#D2B48C"] },
    { etiqueta: "BR", pcn: "1010230 / 1010232", colores: ["#1D1D1F", "#FF3B30"] },
    { etiqueta: "G", pcn: "1030260 / 1010231", colores: ["#86868B"] },
    { etiqueta: "N", pcn: "1030260 / 1010233", colores: ["#D2B48C"] },
    { etiqueta: "NG", pcn: "1010233 / 1010231", colores: ["#D2B48C", "#86868B"] },
    { etiqueta: "RB", pcn: "1010232 / 1010230", colores: ["#FF3B30", "#1D1D1F"] },
    { etiqueta: "R", pcn: "1030260 / 1010232", colores: ["#FF3B30"] },
    { etiqueta: "RR", pcn: "1010232 / 1010232", colores: ["#FF3B30", "#FF3B30"] }
];

let usuarioLogueado = "";
let motorSeleccionado = null; // Almacenará el PCN del motor elegido

// Inicialización General
lucide.createIcons();
renderMotorGrid();

// Renderizar Cuadrícula de Botones de Motores
function renderMotorGrid() {
    const grid = document.getElementById('motorGrid');
    
    configMotores.forEach((motor, index) => {
        const btn = document.createElement('div');
        btn.className = 'motor-btn';
        if (index === 0) {
            btn.classList.add('selected');
            motorSeleccionado = motor.pcn; // Valor por defecto
        }

        // Crear la barra de color visual
        let colorHtml = '';
        motor.colores.forEach(color => {
            colorHtml += `<div class="color-segment" style="background-color: ${color}"></div>`;
        });

        btn.innerHTML = `
            <span>${motor.etiqueta}</span>
            <div class="color-bar">
                ${colorHtml}
            </div>
        `;

        // Evento de Selección
        btn.addEventListener('click', () => {
            // Remover selección previa
            document.querySelectorAll('.motor-btn').forEach(b => b.classList.remove('selected'));
            // Aplicar nueva selección
            btn.classList.add('selected');
            motorSeleccionado = motor.pcn; // Guardar el PCN para la DB
        });

        grid.appendChild(btn);
    });
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

// Simulación de paso automático por escaneo de Gafete
document.getElementById('inputGafete').addEventListener('input', function() {
    const badgeCode = this.value.trim();
    
    if (badgeCode.length > 0) {
        setTimeout(() => {
            usuarioLogueado = this.value.trim(); 
            document.getElementById('txtOperador').innerText = `Op: ${usuarioLogueado}`;
            document.getElementById('userPill').style.display = 'flex';
            switchScreen('screenCapture'); 
        }, 1000);
    }
});

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

    // Se envían N/A en las variables Originales y Cantidad Real para mantener columnas en Google Sheets
    const payload = {
        usuario: usuarioLogueado,
        orden: ordenVal,
        motorOriginal: "N/A", 
        cantOriginal: "N/A",
        motorReal: motorSeleccionado, // Se envía el PCN internamente
        cantReal: "N/A"
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
        
        // Resetear selección de botones a la primera opción
        document.querySelectorAll('.motor-btn').forEach((b, i) => {
            if(i === 0) {
                b.classList.add('selected');
                motorSeleccionado = configMotores[0].pcn;
            } else {
                b.classList.remove('selected');
            }
        });
        
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
            let csvData = "\uFEFF"; 
            csvData += queryResult.headers.join(",") + "\n";

            queryResult.data.forEach(row => {
                // Procesamos cada celda de la fila
                const formattedRow = row.map((cell, index) => {
                    let val = cell;
                    
                    // Si es la columna 0 (la marca de tiempo), formateamos sin espacios complicados
                    if (index === 0 && val) {
                        const date = new Date(val);
                        // Formato: DD/MM/AAAA_HH:MM (sin espacios para evitar cortes)
                        val = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}_${date.getHours()}:${date.getMinutes()}`;
                    }

                    if (index === 2) { // <--- AJUSTA EL ÍNDICE SI LA ORDEN ESTÁ EN OTRA POSICIÓN
                        return `="${val}"`; 
                    }
                    
                    // Envolvemos todo en comillas dobles para que Excel no parta el texto
                    return `"${val}"`;
                });
                
                csvData += formattedRow.join(",") + "\n";
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
