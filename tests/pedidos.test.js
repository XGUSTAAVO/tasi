const request = require('supertest');
const app = require('../src/app');
const pedidosService = require('../src/services/pedidosService');

describe('Testes da API de Pedidos', () => {
  const pedidoValido = {
    cliente: 'Gustavo Silva',
    tipo: 'entrega',
    valor: 350,
    prioridade: 'normal'
  };

  beforeEach(() => {
    pedidosService.limparPedidos();
  });

  // ---------- POST /pedidos ----------

  test('POST /pedidos - deve cadastrar um pedido valido com status recebido (201)', async () => {
    const res = await request(app).post('/pedidos').send(pedidoValido);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 1,
      cliente: 'Gustavo Silva',
      tipo: 'entrega',
      valor: 350,
      prioridade: 'normal',
      status: 'recebido'
    });
  });

  test('POST /pedidos - deve recusar cliente vazio ou so com espacos (400)', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('POST /pedidos - deve recusar valor menor ou igual a zero (400)', async () => {
    const res = await request(app).post('/pedidos').send({
      cliente: 'Gabriela Souza',
      tipo: 'retirada',
      valor: 0,
      prioridade: 'alta'
    });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('POST /pedidos - deve recusar tipo ou prioridade invalidos (400)', async () => {
    const resTipo = await request(app).post('/pedidos').send({
      cliente: 'Guilherme Santos',
      tipo: 'sedex',
      valor: 50,
      prioridade: 'normal'
    });
    expect(resTipo.status).toBe(400);

    const resPrioridade = await request(app).post('/pedidos').send({
      cliente: 'Guilherme Santos',
      tipo: 'entrega',
      valor: 50,
      prioridade: 'super_alta'
    });
    expect(resPrioridade.status).toBe(400);
  });

  test('POST /pedidos - deve recusar valor enviado como texto (400)', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: 'Giovana Lima', valor: '350' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('POST /pedidos - deve recusar corpo vazio (400)', async () => {
    const res = await request(app).post('/pedidos').send({});

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('POST /pedidos - deve remover espacos das extremidades do cliente', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: '  Gabriel Rocha  ' });

    expect(res.status).toBe(201);
    expect(res.body.cliente).toBe('Gabriel Rocha');
  });

  test('POST /pedidos - deve retornar 400 para JSON mal formatado', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"cliente": "Geraldo",');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('JSON mal formatado.');
  });

  // ---------- GET /pedidos ----------

  test('GET /pedidos - deve listar os pedidos cadastrados (200)', async () => {
    await request(app).post('/pedidos').send(pedidoValido);

    const res = await request(app).get('/pedidos');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].cliente).toBe('Gustavo Silva');
  });

  // ---------- GET /pedidos/:id ----------

  test('GET /pedidos/:id - deve retornar o pedido pelo id (200) ou 404 se nao existir', async () => {
    await request(app).post('/pedidos').send({
      cliente: 'Graziela Costa',
      tipo: 'retirada',
      valor: 80,
      prioridade: 'baixa'
    });

    const resOk = await request(app).get('/pedidos/1');
    expect(resOk.status).toBe(200);
    expect(resOk.body.cliente).toBe('Graziela Costa');

    const res404 = await request(app).get('/pedidos/99');
    expect(res404.status).toBe(404);
    expect(res404.body.erro).toBeDefined();
  });

  test('GET /pedidos/:id - deve retornar 404 para id nao numerico', async () => {
    const res = await request(app).get('/pedidos/abc');

    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });

  // ---------- PATCH /pedidos/:id/status ----------

  test('PATCH /pedidos/:id/status - deve atualizar o status seguindo as transicoes permitidas (200)', async () => {
    await request(app).post('/pedidos').send(pedidoValido);

    const res = await request(app)
      .patch('/pedidos/1/status')
      .send({ status: 'em_preparacao' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');
  });

  test('PATCH /pedidos/:id/status - deve retornar 400 em transicao invalida e 404 para ID inexistente', async () => {
    await request(app).post('/pedidos').send(pedidoValido);

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

  test('PATCH /pedidos/:id/status - deve retornar 400 sem o campo status', async () => {
    await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: 'Gilberto Nunes' });

    const res = await request(app).patch('/pedidos/1/status').send({});

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('PATCH /pedidos/:id/status - deve retornar 400 para status desconhecido', async () => {
    await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: 'Gisele Pereira' });

    const res = await request(app)
      .patch('/pedidos/1/status')
      .send({ status: 'voando' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('PATCH /pedidos/:id/status - nao deve alterar pedido cancelado (400)', async () => {
    await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: 'Giovanni Ferraz' });
    await request(app).patch('/pedidos/1/status').send({ status: 'cancelado' });

    const res = await request(app)
      .patch('/pedidos/1/status')
      .send({ status: 'em_preparacao' });

    expect(res.status).toBe(400);
  });

  test('PATCH /pedidos/:id/status - deve percorrer o fluxo completo ate entregue', async () => {
    await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: 'Gael Barbosa' });

    const fluxo = ['em_preparacao', 'enviado', 'entregue'];
    for (const status of fluxo) {
      const res = await request(app).patch('/pedidos/1/status').send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  // ---------- Erro inesperado ----------

  test('Deve retornar 500 caso ocorra um erro inesperado no servidor', async () => {
    jest.spyOn(pedidosService, 'listarPedidos').mockImplementationOnce(() => {
      throw new Error('Falha interna');
    });

    const res = await request(app).get('/pedidos');

    expect(res.status).toBe(500);
    expect(res.body.erro).toBe('Erro interno no servidor.');
  });
});