const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
//Todo middleware here;
app.use(cors());
app.use(express.json());
//Todo root apis here;
app.get('/', (req, res) => {
  res.send('Hello World!');
});
// Todo listen port;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});