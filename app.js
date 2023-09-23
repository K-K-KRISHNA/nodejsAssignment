const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const { isValid } = require("date-fns");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running Successfully");
    });
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
};
initializer();

function backendToFrontEnd(dbObject) {
  const { id, todo, priority, status, category, due_date } = dbObject;
  const frontendObject = {
    id,
    todo,
    priority,
    status,
    category,
    dueDate: due_date,
  };
  return frontendObject;
}

const checking = (request, response, next) => {
  const {
    id = "",
    todo = "",
    priority = "",
    status = "",
    category = "",
    dueDate = "",
  } = request.body;
  if (!(isValid(new Date(dueDate)) || dueDate === "")) {
    response.status(400);
    response.send("Invalid Due Date");
  } else if (
    !(
      category === "" ||
      category === "WORK" ||
      category === "HOME" ||
      category === "LEARNING"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (
    !(
      priority === "" ||
      priority === "HIGH" ||
      priority === "MEDIUM" ||
      priority === "LOW"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    !(
      status === "" ||
      status === "TO DO" ||
      status === "IN PROGRESS" ||
      status === "DONE"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else {
    next();
  }
};

const checkingInquery = (request, response, next) => {
  const { priority = "", status = "", category = "" } = request.query;
  if (
    !(
      category === "" ||
      category === "WORK" ||
      category === "HOME" ||
      category === "LEARNING"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (
    !(
      priority === "" ||
      priority === "HIGH" ||
      priority === "MEDIUM" ||
      priority === "LOW"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    !(
      status === "" ||
      status === "TO DO" ||
      status === "IN PROGRESS" ||
      status === "DONE"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else {
    next();
  }
};

//API 1
app.get("/todos/", checkingInquery, async (request, response) => {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = request.query;
  console.log(request.query);
  const dbQuery = `SELECT * FROM todo WHERE status lIKE '%${status}%' and priority LIKE '%${priority}%' and category LIKE '%${category}%' and todo LIKE '%${search_q}%';`;
  const array = await db.all(dbQuery);
  response.send(array.map((each) => backendToFrontEnd(each)));
});

// API 2----->Pass
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const dbQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const result = await db.get(dbQuery);
  response.send(backendToFrontEnd(result));
});
// API 3--->1 Pass , 1 Fail
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (!isValid(new Date(date))) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const dbQuery = `SELECT * FROM todo WHERE due_date='${date}';`;
    const result = await db.all(dbQuery);
    response.send(result.map((each) => backendToFrontEnd(each)));
  }
});

//API 4
app.post("/todos/", checking, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const dbQuery = `INSERT INTO todo (id,todo,priority,status,category,due_date) VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await db.run(dbQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId", checking, async (request, response) => {
  const { todoId } = request.params;
  const {
    todo = "",
    priority = "",
    status = "",
    category = "",
    dueDate = "",
  } = request.body;
  let dbQuery;
  let result;
  if (todo.length !== 0) {
    dbQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
    result = "Todo Updated";
  } else if (priority.length !== 0) {
    dbQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
    result = "Priority Updated";
  } else if (status.length !== 0) {
    dbQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
    result = "Status Updated";
  } else if (category.length !== 0) {
    dbQuery = `UPDATE todo SET category='${category}' WHERE id=${todoId};`;
    result = "Category Updated";
  } else if (dueDate.length !== 0) {
    dbQuery = `UPDATE todo SET due_date='${dueDate}' WHERE id=${todoId};`;
    result = "Due Date Updated";
  }
  await db.run(dbQuery);
  response.send(result);
});

// API 6------> Pass
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const dbQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(dbQuery);
  response.send("Todo Deleted");
});

module.exports = app;
