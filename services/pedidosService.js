const TIPOS_ACEITOS = ['entrega', 'retirada'];
const PRIORIDADES_ACEITAS = ['baixa', 'normal', 'alta', 'urgente'];
const STATUS_ACEITOS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];

// Regras de mudanca de status
const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'entregue', 'cancelado'],
  enviado: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: []
};

let pedidos = [];
let proximoId = 1;

function criarErro(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function limparPedidos() {
  pedidos = [];
  proximoId = 1;
}

function criarPedido(dados) {
  if (!dados || typeof dados !== 'object') {
    throw criarErro('Dados do pedido nao informados.', 400);
  }

  const { cliente, tipo, valor, prioridade } = dados;

  if (typeof cliente !== 'string' || cliente.trim() === '') {
    throw criarErro('O campo cliente e obrigatorio e nao pode ser vazio.', 400);
  }

  if (typeof valor !== 'number' || isNaN(valor) || valor <= 0) {
    throw criarErro('O valor do pedido deve ser um numero maior que zero.', 400);
  }

  if (!TIPOS_ACEITOS.includes(tipo)) {
    throw criarErro(`Tipo invalido. Use: ${TIPOS_ACEITOS.join(' ou ')}.`, 400);
  }

  if (!PRIORIDADES_ACEITAS.includes(prioridade)) {
    throw criarErro(`Prioridade invalida. Use: ${PRIORIDADES_ACEITAS.join(', ')}.`, 400);
  }

  const novoPedido = {
    id: proximoId++,
    cliente: cliente.trim(),
    tipo,
    valor,
    prioridade,
    status: 'recebido'
  };

  pedidos.push(novoPedido);
  return novoPedido;
}

function listarPedidos() {
  return pedidos;
}

function buscarPedidoPorId(id) {
  const idNum = Number(id);
  const pedido = pedidos.find((p) => p.id === idNum);

  if (!pedido) {
    throw criarErro('Pedido nao encontrado.', 404);
  }

  return pedido;
}

function atualizarStatus(id, novoStatus) {
  if (!novoStatus || !STATUS_ACEITOS.includes(novoStatus)) {
    throw criarErro(`Status invalido. Valores permitidos: ${STATUS_ACEITOS.join(', ')}.`, 400);
  }

  const pedido = buscarPedidoPorId(id);

  const permitidos = TRANSICOES[pedido.status];
  if (!permitidos.includes(novoStatus)) {
    throw criarErro(
      `Nao e permitido mudar o status de '${pedido.status}' para '${novoStatus}'.`,
      400
    );
  }

  pedido.status = novoStatus;
  return pedido;
}

module.exports = {
  criarPedido,
  listarPedidos,
  buscarPedidoPorId,
  atualizarStatus,
  limparPedidos
};