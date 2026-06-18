const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
//Todo middleware here;
app.use(cors());
app.use(express.json());
//Todo root apis here;
app.get('/', (req, res) => {
  res.send('Hello Iam Root Apis Here!')
})
//Todo listen port and text here;
app.listen(port, () => {
  console.log(`This server run on port ${port}`);
})
//! mongodb uri here;
const uri = "mongodb+srv://localChefBazaar:9RYS1svQ0pfxTHOi@cluster0.fdzc9ua.mongodb.net/?appName=Cluster0";
//! client code here;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
//! main funk here;
async function run() {
  try {
    await client.connect();
    //? my db & my colls;
    const myDB = client.db("localChefBazaar");
    const myColl = myDB.collection("cardsData");
    //? get cards data;
    app.get('/cardsData',async (req,res)=>{
      const cursor = myColl.find();
      const result = await cursor.toArray();
      res.send(result)
    })









    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);


