const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
//Todo root apis here;
app.get('/', (req, res) => {
  res.send('Hello World!');
});
// Todo listen port;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});