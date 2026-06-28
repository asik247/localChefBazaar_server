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
    const usersColl = myDB.collection("users");
    const ordersColl = myDB.collection("orders");
    const reviewsColl = myDB.collection("reviews");
    const favoritesColl = myDB.collection("favorites");
    const roleRequestColl = myDB.collection("roleRequest");
    //? get cards data for limit first 6 data;
    app.get('/cardsData', async (req, res) => {
      const cursor = myCardsColl.find().sort({ price: -1 }).limit(6)
      const result = await cursor.toArray();
      res.send(result)
    })
    //? get cards all data;
    app.get('/cardsData/meals', async (req, res) => {
      const cursor = myCardsColl.find().sort({ price: -1 })
      const result = await cursor.toArray();
      res.send(result)
    })
    //? get cards data using id;
    app.get('/cardsData/:id', async (req, res) => {
      const id = req.params.id;
      // console.log('card id',id);
      const query = { _id: new ObjectId(id) };
      const result = await myCardsColl.findOne(query);
      res.send(result)
    })
    //? post user data in db;
    app.post('/users', async (req, res) => {
      //? client site token;
      // const authorization = req.headers.authorization.split(' ')[1]
      // console.log(authorization);
      const usersData = req.body;
      //? already exist user no insert db;
      const email = usersData.email;
      //const query = {clientEmail}
      const emailResult = await usersColl.findOne({ email });
      console.log(emailResult);
      if (emailResult) {
        return res.send({ message: 'user alredy exist' })
      }

      const result = await usersColl.insertOne(usersData);
      res.send(result)
    })
    //Todo get specifique user;
    app.get('/users/:userEmail', async (req, res) => {
      const email = req.params.userEmail
      const result = await usersColl.findOne({ email });
      res.send(result)
    })
    //? post orders data in db;
    app.post('/orders', async (req, res) => {
      const orderInfo = req.body;
      const result = await ordersColl.insertOne(orderInfo);
      res.send(result)
    })
    //? post favorties data in db;
    app.post('/favorites', async (req, res) => {
      const favoritesInfo = req.body;
      //Todo get userEmail,mealId in db;
      const query = {
        userEmail: favoritesInfo.userEmail,
        mealId: favoritesInfo.mealId
      };
      const alreadyExist = await favoritesColl.findOne(query);
      if (alreadyExist) {
        return res.send({
          message: 'already-exists'
        });
      }
      // ! inserted favoritedId indb;
      const result = await favoritesColl.insertOne(favoritesInfo);
      res.send(result)
    })
    //? post reviews data in db;
    app.post('/reviews', async (req, res) => {
      const reviewsData = req.body;
      const result = await reviewsColl.insertOne(reviewsData);
      res.send(result);
    })
    //? get this meal review get;
    app.get('/reviews/:mealId', async (req, res) => {
      const mealId = req.params.mealId;
      const query = {
        mealId: mealId
      };
      const result = await reviewsColl.find(query).toArray();
      res.send(result);
    });
    //Todo post request data in roleRequest coll;
    app.post('/roleRequest',async(req,res)=>{
      const requestInfo = req.body;
      const email = requestInfo.userEmail;
      const query = {
        userEmail:email,
        requestStatus:'pending'
      }
     
      const existingRequest = await roleRequestColl.findOne(query);
      if(existingRequest){
        return res.send({message:'You already have a pending request.'})
      }
      const result = await roleRequestColl.insertOne(requestInfo)
      res.send(result)
    })






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);


