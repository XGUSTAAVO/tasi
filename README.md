# API de Gerenciamento de Pedidos

Projeto prático avaliativo da disciplina **Tópicos Avançados em Sistemas de Informação II**.

É uma API REST pra gerenciar os pedidos de uma lojinha, feita com Node.js e Express (JavaScript). Tem arquitetura em camadas, validação de dados, tratamento de erros e testes automatizados. Os pedidos ficam guardados **só em memória**, então quando o servidor reinicia a lista zera e o id volta pro 1.

- **Aluno:** Gustavo Alves dos Santos
- **RA:** 45312494

## Tecnologias

- Node.js e Express 5
- Jest e Supertest (testes automatizados)
- Postman (testes manuais)
- Git e GitHub

## Como instalar e rodar

Precisa ter o Node.js instalado.

```bash
git clone https://github.com/XGUSTAAVO/tasi.git
cd tasi
npm install
npm start
```

O servidor sobe em `http://localhost:3000`.

Pra rodar os testes:

```bash
npm test
```

## Estrutura do projeto

```
src/
  app.js                       # configura o Express, as rotas e o tratamento de erros
  server.js                    # sobe o servidor na porta 3000
  routes/pedidosRoutes.js      # liga método + rota a uma função do controller
  controllers/pedidosController.js   # recebe a requisição e devolve a resposta HTTP
  services/pedidosService.js   # regras de negócio, validações e armazenamento em memória
tests/
  pedidos.test.js              # testes automatizados (Jest + Supertest)
evidencias/                    # prints do Postman
```

## Arquitetura

Usei **arquitetura em camadas**: cada camada cuida de uma coisa só e só fala com a próxima.

| Camada | Arquivo | O que faz |
|---|---|---|
| Rotas | `routes/pedidosRoutes.js` | Liga o método HTTP e o caminho a uma função do controller. |
| Controller | `controllers/pedidosController.js` | Pega o que veio em `req`, chama o service e responde com o status HTTP certo. Não tem regra de negócio. |
| Service | `services/pedidosService.js` | Valida os dados, aplica as regras de status, guarda os pedidos e lança os erros já com o código HTTP (400 ou 404). |

O **tratamento de erros fica num lugar só**, um middleware no `app.js`: os erros que o service lança viram a resposta em JSON, JSON mal formatado vira 400 e qualquer outro erro vira **500** (pra um erro inesperado não aparecer como se fosse culpa de quem mandou os dados).

Também separei o `app.js` do `server.js` pros testes conseguirem importar a aplicação sem precisar abrir uma porta.

## Valores aceitos

| Campo | Regra |
|---|---|
| `cliente` | Texto obrigatório. Não pode ser vazio nem só espaços (os espaços das pontas são removidos). |
| `tipo` | `entrega` ou `retirada` |
| `valor` | Número maior que zero (texto tipo `"350"` é recusado). |
| `prioridade` | `baixa`, `normal`, `alta` ou `urgente` |
| `status` | `recebido`, `em_preparacao`, `enviado`, `entregue` ou `cancelado` |

Todo pedido novo começa com o status `recebido`.

### Regras de transição de status

| Status atual | Pode ir para |
|---|---|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue`, `cancelado` |
| `entregue` | _(nenhum, é estado final)_ |
| `cancelado` | _(nenhum, é estado final)_ |

Se tentar uma transição que não está na tabela, retorna **400**. Um detalhe: na atualização de status, o valor enviado é validado **antes** de procurar o pedido, então um status inválido dá 400 mesmo se o ID não existir.

## Endpoints

| Método | Rota | Sucesso | Erros |
|---|---|---|---|
| POST | `/pedidos` | 201 | 400 |
| GET | `/pedidos` | 200 | — |
| GET | `/pedidos/:id` | 200 | 404 |
| PATCH | `/pedidos/:id/status` | 200 | 400, 404 |

Erro inesperado retorna **500** com `{"erro": "Erro interno no servidor."}`.

### POST /pedidos

Requisição:

```json
{
  "cliente": "Gustavo Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal"
}
```

Resposta (201):

```json
{
  "id": 1,
  "cliente": "Gustavo Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal",
  "status": "recebido"
}
```

Exemplo de erro (400):

```json
{ "erro": "O campo cliente e obrigatorio e nao pode ser vazio." }
```

### GET /pedidos

Resposta (200): lista com todos os pedidos cadastrados.

```json
[
  { "id": 1, "cliente": "Gustavo Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal", "status": "recebido" }
]
```

### GET /pedidos/:id

Resposta (200): o pedido encontrado. Se o ID não existir, volta 404:

```json
{ "erro": "Pedido nao encontrado." }
```

### PATCH /pedidos/:id/status

Requisição:

```json
{ "status": "em_preparacao" }
```

Resposta (200): o pedido com o status atualizado. Dá 400 se o status for desconhecido, não vier no corpo ou a transição não for permitida, e 404 se o pedido não existir.

## Testes

Os testes automatizados usam **Jest** e **Supertest** e batem na API pelas rotas HTTP, então passam pelas três camadas de uma vez. Antes de cada teste a memória é zerada, pra um teste não interferir no outro.

O que está coberto:

- Criação de pedido válido (201) e remoção dos espaços das pontas do nome do cliente.
- Recusa (400) de cliente vazio ou só com espaços, valor zero ou negativo, valor em texto, tipo ou prioridade inválidos, corpo vazio e JSON mal formatado.
- Listagem de pedidos (200).
- Consulta por ID que existe (200) e por ID inexistente ou não numérico (404).
- Atualização de status válida (200), sem o campo status, com status desconhecido, com transição inválida e em pedido cancelado (400), ID inexistente (404) e o fluxo completo até `entregue`.
- Erro inesperado no servidor (500), simulado com `jest.spyOn`.

```bash
npm test
```

## Evidências (Postman)

Os prints ficam na pasta [`evidencias/`](./evidencias):

| Arquivo | Cenário |
|---|---|
| `01-criacao.png` | POST válido, resposta 201 |
| `02-validacao.png` | POST inválido, resposta 400 |
| `03-listagem.png` | GET da lista de pedidos |
| `04-consulta-inexistente.png` | GET de ID inexistente, resposta 404 |
| `05-atualizacao.png` | PATCH de status válido |

## Uso de IA

Usei IA (o Claude, da Anthropic) como apoio no projeto. Foi pra:

- Revisar o código que eu já tinha, e ela apontou problemas na estrutura de pastas, nos imports e no `package.json`.
- Sugerir ajustes de validação e mais casos de teste.
- Escrever os testes com Jest e Supertest.
- Me guiar nos testes manuais do Postman, nos prints e nos commits do Git.

Sugestões e o que eu decidi:

- **Aceita:** mover o projeto pra pasta `src/`, arrumar os scripts `start` e `test` do `package.json` e tirar a `node_modules` do repositório com um `.gitignore`. Aceitei porque sem isso o projeto não rodava com `npm install` e `npm start`, e o enunciado proíbe versionar a `node_modules`.
- **Modificada:** a suíte de testes que veio sugerida. Eu mudei os dados dos testes (os nomes dos clientes) e fui conferindo o que cada teste verifica, em vez de só copiar e colar.
- **Rejeitada:** uns ajustes opcionais de robustez, como devolver uma cópia do array na listagem, validar o ID com regex, criar um 404 em JSON pra rotas que não existem e ler a porta de uma variável de ambiente. Não apliquei porque o enunciado não pedia e eu não ia conseguir justificar tudo isso sem deixar o projeto mais complicado.

O código entregue eu rodei, testei e revisei, e sou eu que preciso entender e justificar ele.
