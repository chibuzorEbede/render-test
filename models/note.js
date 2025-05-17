//setup the mongo db
const mongoose = require("mongoose");

//get mongodb url details from environment variable
const url = process.env.MONGODB_URI;

mongoose.set("strictQuery", false);

//make a connection to the DB
mongoose
  .connect(url)
  .then((result) => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log("error connecting to database: ", err);
  });

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    minLength: 5,
    required: true,
  },
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

module.exports = mongoose.model("Note", noteSchema);
