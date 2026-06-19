const express = require('express');
const cors = require('cors');
// ! dotenv;
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.fdzc9ua.mongodb.net/?appName=Cluster0`;
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
    const myCardsColl = myDB.collection("cardsData");
    //? get cards data for limit first 6 data;
    app.get('/cardsData', async (req, res) => {
      const cursor = myCardsColl.find().sort({price:-1}).limit(6)
      const result = await cursor.toArray();
      res.send(result)
    })
    //? get cards all data;
    app.get('/cardsData/meals', async (req, res) => {
      const cursor = myCardsColl.find()
      const result = await cursor.toArray();
      res.send(result)
    })
    //? get cards data using id;
    app.get('/cardsData/:id',async(req,res)=>{
      const id = req.params.id;
      console.log('card id',id);
      const query = { _id:new ObjectId(id)};
      const result = await myCardsColl.findOne(query);
      res.send(result)
    })









    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);


