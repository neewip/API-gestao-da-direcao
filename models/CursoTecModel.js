// models/userModel.js

// Importa o Request e os tipos de dados (TYPES) do pacote "tedious" para criar e executar consultas SQL
const { Request, TYPES } = require("tedious");

// Importa a função que conecta ao banco de dados
const connectDatabase = require("../database/connection");

// Função genérica para executar uma query SQL
async function executeQuery(query, params = []) {
  // Estabelece uma conexão com o banco de dados
  const connection = await connectDatabase();
  
  // Retorna uma Promise para lidar com a execução assíncrona da query
  return new Promise((resolve, reject) => {
    // Cria uma nova requisição SQL com a query passada e um callback para erros
    const request = new Request(query, (err) => {
      if (err) {
        // Se ocorrer um erro, a Promise é rejeitada e a conexão é fechada
        reject(err);
        connection.close();
      }
    });

    // Adiciona parâmetros à requisição SQL (nome, tipo e valor)
    params.forEach(({ name, type, value }) => {
      request.addParameter(name, type, value);
    });

    // Array para armazenar os resultados retornados pela query
    let results = [];

    // Evento "row" é disparado para cada linha retornada pela query
    request.on("row", (columns) => {
      // Cria um objeto para cada linha e armazena suas colunas e valores
      let row = {};
      columns.forEach((column) => {
        row[column.metadata.colName] = column.value;
      });
      results.push(row);
    });

    // Evento "requestCompleted" é disparado quando a query é completamente executada
    request.on("requestCompleted", () => {
      // Fecha a conexão com o banco de dados e resolve a Promise com os resultados
      connection.close();
      resolve(results);
    });

    // Executa a requisição SQL
    connection.execSql(request);
  });
}

// Função para obter todos os usuários do banco de dados
async function getAllUsers() {
  const query = "SELECT * FROM CursoTec;";  // Define a query SQL para obter todos os registros da tabela "Users"
  return await executeQuery(query);  // Executa a query usando a função executeQuery
}

// Função para obter um usuário pelo ID
async function getUserById(rm) {
  const query = "SELECT * FROM CursoTec WHERE rm = @rm";  // Query SQL com um parâmetro para filtrar pelo ID
  const params = [{ name: "rm", type: TYPES.Int, value: rm }];  // Define o parâmetro @id para ser passado na query
  const users = await executeQuery(query, params);  // Executa a query com os parâmetros
  return users.length > 0 ? users[0] : null;  // Retorna o primeiro usuário se houver algum resultado, ou null se não houver
}

async function getUserByFilter(etapa, Turma, ano) {
  etapa = parseInt(etapa, 10); // Parse etapa as an integer
  const query = "select * from CursoTecFilter where etapa = @etapa and Turma LIKE @Turma AND ano = @ano";
  const params = [
    { name: "etapa", type: TYPES.Int, value: etapa },
    { name: "Turma", type: TYPES.VarChar, value: Turma },
    { name: "ano", type: TYPES.Int, value: ano },
  ];
  const users = await executeQuery(query, params);
  return users;
}

// Exporta as funções para serem usadas nos controllers
module.exports = {
  getAllUsers,
  getUserById,
  getUserByFilter,
};