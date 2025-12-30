const express = require('express');
const axios = require('axios');
const https = require('https');

const app = express();
app.use(express.json());

const cert = Buffer.from(process.env.INTER_CERT || '', 'base64').toString('utf8');
const key = Buffer.from(process.env.INTER_KEY || '', 'base64').toString('utf8');

const httpsAgent = new https.Agent({
    cert: cert,
    key: key,
});

app.get('/', (req, res) => {
    res.send('Inter Proxy OK');
});

app.post('/proxy', async (req, res) => {
    const { method, url, headers, data } = req.body;
    
    // Garantir que data seja um objeto, não string
    const bodyData = typeof data === 'string' ? JSON.parse(data) : data;
    
    console.log('Proxying:', method, url);
    console.log('Body data:', JSON.stringify(bodyData));
    
    const cleanHeaders = { ...headers };
    delete cleanHeaders['host'];
    delete cleanHeaders['content-length'];
    
    try {
        const response = await axios({
            method,
            url,
            headers: cleanHeaders,
            data: bodyData,
            httpsAgent,
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Erro:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Proxy rodando na porta ${PORT}`);
});

