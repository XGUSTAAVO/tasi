const express = require('express');
const pedidosRoutes = require('./routes/pedidosRoutes');

const app = express();

app.use(express.json());

app.use('/pedidos', pedidosRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ erro: 'JSON mal formatado.' });
  }

  if (err.status) {
    return res.status(err.status).json({ erro: err.message });
  }

  return res.status(500).json({ erro: 'Erro interno no servidor.' });
});

module.exports = app;