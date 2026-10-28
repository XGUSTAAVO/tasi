const request = require('supertest');
const app = require('../src/app');
const pedidosService = require('../src/services/pedidosService');

describe('Testes da API de Pedidos', () => {
  beforeEach(() => {
    pedidosService.limparPedidos();
  });

  test('POST /pedidos - deve cadastrar um pedido valido com status recebido (201)', async () => {
    const res = await request(app).post('/pedidos').send({
      cliente: 'Carlos Silva',
      tipo: 'entrega',
      valor: 350,
      prioridade: 'normal'
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 1,
      cliente: 'Carlos Silva',
      tipo: 'entrega',
      valor: 350,
      prioridade: 'normal',
      status: 'recebido'
    });
  });

  test('POST /pedidos - deve recusar cliente vazio ou so com espacos (400)', async () => {
    const res = await request(app).post('/pedidos').send({
      cliente: '   ',
      tipo: 'entrega',
      valor: 100,
      prioridade: 'normal'
    });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('POST /pedidos - deve recusar valor menor ou igual a zero (400)', async () => {
    const res = await request(app).post('/pedidos').send({
      cliente: 'Maria',
      tipo: 'retirada',
      valor: 0,
      prioridade: 'alta'
    });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('POST /pedidos - deve recusar tipo ou prioridade invalidos (400)', async () => {
    const resTipo = await request(app).post('/pedidos').send({
      cliente: 'Joao',
      tipo: 'sedex',
      valor: 50,
      prioridade: 'normal'
    });
    expect(resTipo.status).toBe(400);

    const resPrioridade = await request(app).post('/pedidos').send({
      cliente: 'Joao',
      tipo: 'entrega',
      valor: 50,
      prioridade: 'super_alta'
    });
    expect(resPrioridade.status).toBe(400);
  });

  test('GET /pedidos - deve listar os pedidos cadastrados (200)', async () => {
    await request(app).post('/pedidos').send({
      cliente: 'Carlos Silva',
      tipo: 'entrega',
      valor: 350,
      prioridade: 'normal'
    });

    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].cliente).toBe('Carlos Silva');
  });

  test('GET /pedidos/:id - deve retornar o pedido pelo id (200) ou 404 se nao existir', async () => {
    await request(app).post('/pedidos').send({
      cliente: 'Ana',
      tipo: 'retirada',
      valor: 80,
      prioridade: 'baixa'
    });

    const resOk = await request(app).get('/pedidos/1');
    expect(resOk.status).toBe(200);
    expect(resOk.body.cliente).toBe('Ana');

    const res404 = await request(app).get('/pedidos/99');
    expect(res404.status).toBe(404);
    expect(res404.body.erro).toBeDefined();
  });

  test('PATCH /pedidos/:id/status - deve atualizar o status seguindo as transicoes permitidas (200)', async () => {
    await request(app).post('/pedidos').send({
      cliente: 'Carlos Silva',
      tipo: 'entrega',
      valor: 350,
      prioridade: 'normal'
    });

    const res = await request(app)
      .patch('/pedidos/1/status')
      .send({ status: 'em_preparacao' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');
  });

  test('PATCH /pedidos/:id/status - deve retornar 400 em transicao invalida e 404 para ID inexistente', async () => {
    await request(app).post('/pedidos').send({
      cliente: 'Carlos Silva',
      tipo: 'entrega',
      valor: 350,
      prioridade: 'normal'
    });

    // Tenta pular de recebido direto para entregue
    const resInvalido = await request(app)
      .patch('/pedidos/1/status')
      .send({ status: 'entregue' });
    expect(resInvalido.status).toBe(400);

    // ID que nao existe
    const res404 = await request(app)
      .patch('/pedidos/999/status')
      .send({ status: 'cancelado' });
    expect(res404.status).toBe(404);
  });

  test('Deve retornar 500 caso ocorra um erro inesperado no servidor', async () => {
    jest.spyOn(pedidosService, 'listarPedidos').mockImplementationOnce(() => {
      throw new Error('Falha interna');
    });

    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(500);
    expect(res.body.erro).toBe('Erro interno no servidor.');
  });
});