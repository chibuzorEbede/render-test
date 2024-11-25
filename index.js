const express = require("express");
const cors = require("cors");
require("dotenv").config(); //add this line so you can access the variables in the .env file

//setup the mongo db
const mongoose = require("mongoose");

//get mongodb url details from environment variable
const url = process.env.MONGODB_URI;

mongoose.set("strictQuery", false);
mongoose.connect(url);

const noteSchema = new mongoose.Schema({
  content: String,
  important: Boolean,
});

// //transform the returned notes object to suit our needs
noteSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Note = mongoose.model("Note", noteSchema);

//setup the app
const app = express();

//parse application/x-www-form encoded
app.use(express.urlencoded({ extended: false }));

//parse application/json
app.use(express.json());

//create local notes variables
let notes = [
  {
    id: "1",
    content: "HTML is easy",
    important: true,
  },
  {
    id: "2",
    content: "Browser can execute only JavaScript",
    important: false,
  },
  {
    id: "3",
    content: "GET and POST are the most important methods of HTTP protocol",
    important: true,
  },
  {
    id: "4",
    content: "GET and POST are the most important methods of HTTP protocol",
    important: true,
  },
];

//generate user id
const getId = (arr) => {
  const id = arr.length > 0 ? Math.max(...arr.map((el) => Number(el.id))) : 0;
  return String(id + 1);
};

//custom middleware

//request logger that prints info about every received request
const requestLogger = (request, response, next) => {
  console.log("---START---");
  console.log("method: ", request.method);
  console.log("path: ", request.path);
  console.log("body: ", request.body);
  console.log("---END---");
  next();
};

//middleware for unknown endpoint
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

//add request logger middle ware (used for existing routes)
app.use(requestLogger);

//add cors middleware
app.use(cors());

//set api routes

//GET ==> return all notes resources
app.get("/api/notes/", (request, response) => {
  //get the notes from the mongodb database
  Note.find({}).then((notes) => {
    console.log("the notes", notes);
    response.json(notes);
  });
});

//GET/id ==> get a single note {takes a note id and returns a note resource}
app.get("/api/notes/:id", (request, response) => {
  const id = request.params.id;
  const note = notes.find((note) => note.id === id);

  if (note) {
    response.json(note);
  } else {
    //set a status message to be displayed beside the http error code
    response.statusMessage = `file with id: ${id} not found`;
    //set the status code foe resource not found
    response.status(404).end();
  }
});

//create a new note resource
app.post("/api/notes", (request, response) => {
  //get note data from user and add to local notes
  const data = request.body;

  //check if note is empty
  if (!data.content) {
    return response.status(400).json({ error: "content missing" });
  }
  //build the note
  const note = {
    id: getId(notes),
    content: data.content,
    important: Boolean(data.important) || false,
  };
  //add the new note to the old notes array
  notes = notes.concat(note);

  //send a response
  response.json(note);
});

//DELETE/id ==> delete a single note {takes a note id and returns the removed note resource}
app.delete("/api/notes/:id", (request, response) => {
  const id = request.params.id;
  notes = notes.filter((note) => note.id !== id);

  response.status(204).end();
});

app.use(unknownEndpoint);

//set port and listen
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});
