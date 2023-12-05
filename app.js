const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getToDosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getToDosQuery = `
          SELECT * FROM todo WHERE 
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}';
          `;
      break;
    case hasPriorityProperty(request.query):
      getToDosQuery = `
          SELECT * FROM todo WHERE 
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';
          `;
      break;
    case hasStatusProperty(request.query):
      getToDosQuery = `
          SELECT * FROM todo WHERE 
          todo LIKE '%${search_q}%'
          AND status = '${status}';
          `;
      break;

    default:
      getToDosQuery = `
          SELECT 
          * 
          FROM 
          todo 
          WHERE todo LIKE '%${search_q}%'
          
          `;
  }

  data = await db.all(getToDosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getToDoQuery = `
  SELECT * FROM todo WHERE id =${todoId}`;

  const todo = await db.get(getToDoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body; //Destructuring id column
  const insertTodo = `
        INSERT INTO todo (id, todo, priority, status)
        VALUES (${id},'${todo}','${priority}','${status}');`; //Updated the id column inside the SQL Query
  await db.run(insertTodo);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
  }

  const previousToDoQuery = `
    SELECT
       *
    FROM 
     todo
    WHERE id= ${todoId}`;

  const previousToDo = await db.get(previousToDoQuery);

  const {
    todo = previousToDo.todo,
    priority = previousToDo.priority,
    status = previousToDo.status,
  } = request.body;

  const updateToDoQuery = `
    UPDATE
      todo
    SET
        todo='${todo}',
        priority='${priority}',
        status='${status}'
    WHERE id= ${todoId} `;
  await db.run(updateToDoQuery);
  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteToDoQuesry = `
    DELETE FROM todo WHERE id= ${todoId} `;
  await db.run(deleteToDoQuesry);
  response.send("Todo Deleted");
});

module.exports = app;
