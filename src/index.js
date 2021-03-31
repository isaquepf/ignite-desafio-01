const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const HttpStatus = {
  Created: 201,
  Ok: 200,
  NoContent: 204,
  NotFound: 404,
  BadRequest: 400,
  Conflict: 409,
  UnprocessableEntity: 422
};

class ApiError {
  constructor(error) {
    this.error = error;
  }
}

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  let user = users.find((user) => user.username === username);

  if (!user)
    return response.status(HttpStatus.NotFound).send(new ApiError('user not found!'));

  request.user = user;

  return next();
}

function checksExistsTodo(request, response, next) {
  const { id } = request.params;
  const { user } = request;

  const todos = user.todos;

  const todo = todos.find(todo => id === todo.id);

  if (!todo) {
    return response.status(404).json({ error: "Todo Not found!" });
  }

  request.todo = todo;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const user = users.find((_) => _.username == username);

  if (user)
    response.status(HttpStatus.BadRequest).json(new ApiError('User already exists!'));

  if (!name || !username)
    response.status(HttpStatus.BadRequest).json(new ApiError('please check your data!'))

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser);

  response.status(HttpStatus.Created).json(newUser);
});



app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.status(HttpStatus.Ok).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  if (!title && !deadline)
    return response.status(HttpStatus.BadRequest).json(new ApiError('Title and deadline are requireds!'));

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(todo);

  response.status(HttpStatus.Created).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {  
  const { title, deadline } = request.body;
  const { todo } = request;

  if (!title && !deadline)
    return response.status(HttpStatus.BadRequest).json(new ApiError('Title and deadline are required!'));
  
  todo.title = title;
  todo.deadline = deadline;

  return response.status(HttpStatus.Created).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {  
  const { todo } = request;
  
  todo.done = true;

  return response.status(HttpStatus.Created).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user, todo } = request;

  user.todos.splice(todo.id, 1);
  
  response.status(HttpStatus.NoContent).json(user.todos);
});

module.exports = app;