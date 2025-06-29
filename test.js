const mongoose = require('mongoose');
const uri = "mongodb+srv://9899only:GbL238YubBjMgl02@ciseportal.ihyzggn.mongodb.net/?retryWrites=true&w=majority&appName=CISEPORTAL";

mongoose.connect(uri)
  .then(() => console.log("Connected"))
  .catch((err) => console.error("Connection error:", err));
