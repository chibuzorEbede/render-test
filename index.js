require("dotenv").config(); //add this line so you can access the variables in the .env file
const express = require("express");
const cors = require("cors");

//get the note model from the db
const Note = require("./models/note");

//setup the app
const app = express();

//parse application/x-www-form encoded
app.use(express.urlencoded({ extended: false }));

//parse application/json
app.use(express.json());

// start custom middlewares

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

const errorHandler = (error, request, response, next) => {
  // console.error(error.message);
  if (error.name === "CastError") {
    return response.status(400).json({ error: error.message });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

// end custom middlewares

//add request logger middle ware (used for existing routes)
app.use(requestLogger);

//add cors middleware
app.use(cors());

//set api routes

//GET ==> endpoint to  return all notes
app.get("/api/notes/", (request, response) => {
  //get the notes from the mongodb database
  Note.find({}).then((notes) => {
    console.log("the notes", notes);
    response.json(notes);
  });
});

//GET/id ==> get a single note {takes a note id and returns a note resource}
app.get("/api/notes/:id", (request, response, next) => {
  const id = request.params.id;
  Note.find({ _id: id })
    .then((note) => {
      if (note.length !== 0) {
        response.json(note);
      } else {
        //set a status message to be displayed beside the http error code
        response.statusMessage = `file with id: ${id} not found`;
        //set the status code foe resource not found
        response.status(404).end();
      }
    })
    .catch((err) => next(err));
});

//create a new note resource
app.post("/api/notes", (request, response, next) => {
  //get note data from user and add to local notes
  const data = request.body;

  //check if note is empty [moved to error handler]
  // if (!data.content || data.content === undefined) {
  //   return response.status(400).json({ error: "content missing" });
  // }

  //build the note
  const note = new Note({
    content: data.content,
    important: Boolean(data.important) || false,
  });
  note
    .save()
    .then((savedNote) => {
      response.json(savedNote);
    })
    .catch((error) => next(error));
});

//DELETE id ==> delete a single note {takes a note id and returns the removed note resource}
app.delete("/api/notes/:id", (request, response, next) => {
  const id = request.params.id;
  Note.findByIdAndDelete(id)
    .then((result) => {
      console.log(`delete object is ${result}`);

      if (!result) {
        return response
          .status(404)
          .json({ error: `note with id ${id} not found` });
      }
      return response
        .status(204)
        .json({ successful: `note with id ${id} deleted.` });
    })
    .catch((err) => next(err));
});

//Update a note resource
app.put("/api/notes/:id", (request, response, next) => {
  const id = request.params.id;
  const body = request.body;

  const note = {
    content: body.content,
    important: body.important,
  };

  Note.findByIdAndUpdate(id, note, {
    new: true,
    runValidators: true,
    context: "query",
  })
    .then((updatedNote) => {
      if (!updatedNote) {
        return response.status(404).json({ error: "note not found" });
      }
      return response.status(200).json(updatedNote);
    })
    .catch((err) => next(err));
});

//use the unknown endpoint logger middle ware (used for non existing routes)
app.use(unknownEndpoint);
//use the error handling middleware
app.use(errorHandler);

//set port and listen
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});
