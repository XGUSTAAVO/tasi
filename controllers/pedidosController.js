const pedidosService = require('../services/pedidosService');

function criar(req, res, next) {
  try {
    const pedido = pedidosService.criarPedido(req.body);
    return res.status(201).json(pedido);
  } catch (err) {
    return next(err);
  }
}

function listar(req, res, next) {
  try {
    const lista = pedidosService.listarPedidos();
    return res.status(200).json(lista);
  } catch (err) {
    return next(err);
  }
}

function buscarPorId(req, res, next) {
  try {
    const pedido = pedidosService.buscarPedidoPorId(req.params.id);
    return res.status(200).json(pedido);
  } catch (err) {
    return next(err);
  }
}

function atualizarStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    const pedido = pedidosService.atualizarStatus(req.params.id, status);
    return res.status(200).json(pedido);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizarStatus
};