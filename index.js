const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const morgan = require('morgan');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const flowFilePath = './flows.json'; // Ruta del archivo flows.json

// Variables globales
let currentQR = '';
const userStates = {};
const botOwnerNumber = '519XXXXXXXX@c.us'; // Reemplazar con el número del propietario

const app = express();
const port = 3000;

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

// API para obtener el QR actual
app.get('/api/qr', (req, res) => {
    if (currentQR) {
        return res.json({ qr: currentQR });
    }
    res.status(404).json({ error: 'QR no disponible.' });
});

// API para obtener el flujo actual
app.get('/api/flow', (req, res) => {
    try {
        const flow = require(flowFilePath);
        res.json(flow);
    } catch (error) {
        res.status(500).json({ error: 'No se pudo cargar el flujo.' });
    }
});

// API para actualizar el flujo completo
app.post('/api/flow', (req, res) => {
    const newFlow = req.body;

    // Validar estructura del flujo
    if (!newFlow || typeof newFlow !== 'object') {
        return res.status(400).json({ error: 'El flujo debe ser un objeto JSON válido.' });
    }

    // Escribir los cambios en flows.json
    fs.writeFile(flowFilePath, JSON.stringify(newFlow, null, 2), (err) => {
        if (err) {
            console.error('[Error] No se pudo guardar el flujo:', err);
            return res.status(500).json({ error: 'No se pudo guardar el flujo.' });
        }
        console.log('[Flujo] Flujo actualizado correctamente.');
        res.json({ success: true });
    });
});

// Inicializar cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
    currentQR = qr;
    qrcode.generate(qr, { small: true });
    console.log('[QR] Escanea el código QR desde el cliente.');
});

client.on('ready', () => {
    console.log('🤖 Bot conectado y listo para recibir mensajes');
    currentQR = ''; // Limpiar QR cuando está conectado
});

// Modifica esta parte en `handleDynamicFlow` para establecer el mensaje de bienvenida
async function handleDynamicFlow(userId, userMessage, message) {
    const flow = require(flowFilePath);
    const state = userStates[userId] || {};
    const currentQuestion = state.currentQuestion || 'welcome'; // Bienvenida como punto inicial

    // Obtener próxima pregunta
    const nextQuestion = flow[currentQuestion]?.[userMessage];
    if (nextQuestion) {
        userStates[userId] = { currentQuestion: nextQuestion };
        message.reply(flow[nextQuestion].message || '🤖 Respuesta configurada.');
    } else {
        // Manejar opciones no válidas
        const defaultMessage = flow[currentQuestion]?.default || 
                               '🤖 No entiendo esa opción. Intenta nuevamente.';
        message.reply(defaultMessage);
    }
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/app.html');
});

app.listen(port, () => {
    console.log(`[Servidor] Servidor iniciado en http://localhost:${port}`);
});
