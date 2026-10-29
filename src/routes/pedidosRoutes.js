const express = require('express');
const pedidosController = require('../controllers/pedidosController');

const router = express.Router();

router.post('/', pedidosController.criar);
router.get('/', pedidosController.listar);
router.get('/:id', pedidosController.buscarPorId);
router.patch('/:id/status', pedidosController.atualizarStatus);

module.exports = router;