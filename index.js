const express = require('express');
const cors = require('cors');
// ! dotenv;
require('dotenv').config()
//! Firebase Admin
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// In production, set FIREBASE_SERVICE_ACCOUNT to the complete Firebase service
// account JSON. The local file remains an optional development fallback and is
// intentionally not committed to source control.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('./localchefbazaar.json');

initializeApp({
  credential: cert(serviceAccount),
});
//! generate tracking id;
const generateTrackingId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `LCB-${Date.now()}-${randomNum}`;
}
//? stripe;
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { MongoClient, ServerApiVersion, ObjectId, Admin } = require('mongodb');
const { Transaction } = require('firebase-admin/firestore');
const app = express();
const port = process.env.PORT || 3000;
//Todo middleware here;
app.use(cors());
app.use(express.json());
//! Firebase Verify Middleware
const verifyFirebase = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({
      message: 'unauthorized access'
    });
  }
  const token = authorization.split(' ')[1];
  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.decoded_email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).send({
      message: 'unauthorized access'
    });
  }
};
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
    const paymentsColl = myDB.collection("payments");
    //? post cards data in db;
    app.post('/cardsData', async (req, res) => {
      const mealsData = req.body;
      const chefEmail = req.body.userEmail;
      const query = {
        email: chefEmail
      }
      const chef = await usersColl.findOne(query);
      if (chef.status === 'fraud') {
        return res.status(403).send({
          message: 'Fraud chefs cannot create meals'
        })
      }

      const result = await myCardsColl.insertOne(mealsData)
      res.send(result)
    })
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
    //? get cards logIn Chef all data;
    app.get('/cardsData/chef/:chefEmail', async (req, res) => {
      const email = req.params.chefEmail;
      const query = {
        userEmail: email
      }
      const result = await myCardsColl.find(query).toArray();
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
    //? get partial Search value match in db;
    app.get('/cardsData/search/partial/:value', async (req, res) => {
      const search = req.params.value;
      const SearchData = {
        name: {
          $regex: search,
          $options: 'i'
        }
      }
      const result = await myCardsColl.find(SearchData).toArray();
      res.send(result)
    })
    //? delete chef card;
    app.delete('/cardsData/remove/:id', async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      }
      const result = await myCardsColl.deleteOne(query);
      res.send(result)
    })
    //? update cardsData in db and ui;
    app.patch('/cardsData/update/:id', async (req, res) => {
      const id = req.params.id;
      const updateInfo = req.body;

      const result = await myCardsColl.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: updateInfo
        }
      );

      res.send(result);
    });
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
    //! get All user in admin page manage users;
    app.get('/users', async (req, res) => {
      const result = await usersColl.find().toArray();
      res.send(result)
    })
    //Todo get specifique user;
    app.get('/users/:userEmail', verifyFirebase, async (req, res) => {
      const email = req.params.userEmail
      //? Token email
      const tokenEmail = req.decoded_email;
      if (email !== tokenEmail) {
        return res.status(403).send({
          message: 'forbidden access'
        });
      }
      const query = {
        email: email
      }
      const result = await usersColl.findOne(query);
      res.send(result)
    })
    //? user role get;
    app.get('/users/:email/role', async (req, res) => {
      const email = req.params.email
      const user = await usersColl.findOne({ email });
      res.send({ role: user?.role || 'user' })
    })
    //! Accepted users requst and update userColl rol + unique chef id;
    app.patch('/users/requestUpdate/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const { requestType, email } = req.body;
      //? validation for chef or admin;
      let updateData = {};
      if (requestType === "chef") {
        updateData = {
          role: "chef",
          chefId: `chef-${Math.floor(
            1000 + Math.random() * 9000
          )}`
        };
      } else if (requestType === "admin") {
        updateData = {
          role: "admin"
        };
      }
      const resultUpdate = await usersColl.updateOne({ email: email }, { $set: updateData });
      // ? role requst coll update;
      const roleRequestUpdate = {
        $set: {
          requestStatus: 'approved'
        }
      }
      const requestResult = await roleRequestColl.updateOne(query, roleRequestUpdate)
      res.send({ resultUpdate, requestResult })
    })
    //? farud user aps update status;
    app.patch('/users/fraud/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status: 'fraud'
        }
      }
      const result = await usersColl.updateOne(query, update);
      res.send(result)
    })

    //? post orders data in db;
    app.post('/orders', async (req, res) => {
      const orderInfo = {
        ...req.body,
        trackingId: generateTrackingId()
      }
      const userEmail = req.body.buyerEmail;
      const query = {
        email: userEmail
      }
      const user = await usersColl.findOne(query);
      if (user.status === 'fraud') {
        return res.status(403).send({
          message: 'Fraud chefs cannot create meals'
        })
      }

      const result = await ordersColl.insertOne(orderInfo);
      res.send(result)
    })
    //! get orders data login user;
    app.get('/orders/:orderEmail', verifyFirebase, async (req, res) => {
      const email = req.params.orderEmail;
      //? Token email
      const tokenEmail = req.decoded_email;
      if (email !== tokenEmail) {
        return res.status(403).send({
          message: 'forbidden access'
        });
      }
      const query = {
        buyerEmail: email
      }
      const result = await ordersColl.find(query).toArray();
      res.send(result)
    })
    //! get orders data chef order items user;
    app.get('/orders/chefOrder/:id', verifyFirebase, async (req, res) => {
      const id = req.params.id;
      const { email } = req.query;
      const query = {
        chefId: id
      }
      //? Token email
      const tokenEmail = req.decoded_email;
      if (email !== tokenEmail) {
        return res.status(403).send({
          message: 'forbidden access'
        });
      }
      const result = await ordersColl.find(query).toArray()
      res.send(result)
    })
    //? patch order coll;
    app.patch('/orders/statusUpdate/:id', async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      const updateDoc = {
        $set: {
          orderStatus: status
        }
      };

      if (status === "accepted") {
        updateDoc.$set.acceptedAt = new Date();
      }
      if (status === "preparing") {
        updateDoc.$set.preparingAt = new Date();
      }

      if (status === "delivered") {
        updateDoc.$set.deliveredAt = new Date();
      }

      if (status === "canceled") {
        updateDoc.$set.canceledAt = new Date();
      }

      const result = await ordersColl.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );

      res.send(result);
    });
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
    //? get login user all favorites meals;
    app.get('/favorites/:email', verifyFirebase, async (req, res) => {
      const email = req.params.email;
      //? Token email
      const tokenEmail = req.decoded_email;
      if (email !== tokenEmail) {
        return res.status(403).send({
          message: 'forbidden access'
        });
      }
      const query = {
        userEmail: email
      }
      const result = await favoritesColl.find(query).toArray();
      res.send(result)
    })
    //! delete favorites meals using dynamic id;
    app.delete('/favorites/:id', async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      }
      const result = await favoritesColl.deleteOne(query);
      res.send(result)
    })
    //? post reviews data in db;
    app.post('/reviews', async (req, res) => {
      const reviewsData = req.body;
      const result = await reviewsColl.insertOne(reviewsData);
      res.send(result);
    })
    //? get this meal review get;
    app.get('/reviews/:mealId', verifyFirebase, async (req, res) => {
      const mealId = req.params.mealId;
      const query = {
        mealId: mealId
      };
      const result = await reviewsColl.find(query).toArray();
      res.send(result);
    });
    //! get loged in user reviews in db;
    app.get('/reviews/user/:userEmail', verifyFirebase, async (req, res) => {
      const logedINEmail = req.params.userEmail;
      //? Token email
      const tokenEmail = req.decoded_email;
      if (logedINEmail !== tokenEmail) {
        return res.status(403).send({
          message: 'forbidden access'
        });
      }
      const query = {
        userEmail: logedINEmail
      }
      const result = await reviewsColl.find(query).toArray();
      res.send(result)
    })
    //? update review in dynamic id;
    app.patch('/reviews/update/:id', async (req, res) => {
      const { rating, comment } = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateReview = {
        $set: {
          rating: rating,
          comment: comment
        }
      }
      const result = await reviewsColl.updateOne(query, updateReview)
      res.send(result)

    })
    //! remove review in dynamic id;
    app.delete('/reviews/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewsColl.deleteOne(query);
      res.send(result)
    })

    //Todo post request data in roleRequest coll;
    app.post('/roleRequest', async (req, res) => {
      const requestInfo = req.body;
      const email = requestInfo.userEmail;
      const query = {
        userEmail: email,
        requestStatus: 'pending'
      }
      const existingRequest = await roleRequestColl.findOne(query);
      if (existingRequest) {
        return res.send({ message: 'You already have a pending request.' })
      }
      const result = await roleRequestColl.insertOne(requestInfo)
      res.send(result)
    })
    //? get all request info in admin request manage page;
    app.get('/roleRequest', async (req, res) => {
      const result = await roleRequestColl.find().toArray();
      res.send(result);
    })
    //? update roleRequest requestStatus;
    app.patch('/roleRequest/:id', async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      }
      const updateRequestStatus = {
        $set: {
          requestStatus: 'rejected'
        }
      }
      const result = await roleRequestColl.updateOne(query, updateRequestStatus)
      res.send(result)
    })
    //? stripe code/checked out session;
    app.post('/create-checkout-session', async (req, res) => {
      const ordersInfo = req.body;
      const amount = ordersInfo.price * 100;
      const session = await stripe.checkout.sessions.create({
        //? line items;
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: amount,
              product_data: {
                name: ordersInfo.mealName
              }
            },
            //Todo price data end;
            quantity: 1
          }
        ],
        // Todo line items end;
        mode: 'payment',
        metadata: {
          trackingId: ordersInfo.trackingId,
          foodId: ordersInfo.foodId,
          mealName: ordersInfo.mealName
        },
        customer_email: ordersInfo.buyerEmail,
        success_url: `${process.env.STRIP_DOMAIN}/dashboardLayouts/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.STRIP_DOMAIN}/dashboardLayouts/payment-cancelled?session_id={CHECKOUT_SESSION_ID}`,
      })
      res.send({ url: session.url })

    })
    //? stripe code retrive;
    app.patch('/paymentSuccess', async (req, res) => {
      const sessionId = req.query.session_id;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      //? dublicate checked;
      const transactionId = session.payment_intent;
      const query = {
        transactionId: transactionId
      }
      const existingTransactionId = await paymentsColl.findOne(query);
      if (existingTransactionId) {
        return res.send({ message: 'already transactionId exist', transactionId, trackingId: existingTransactionId.trackingId })
      }
      //? update paymentStatus;
      const trackingId = session.metadata.trackingId;
      if (session.payment_status === 'paid') {
        const updatePaymentStatus = {
          $set: {
            paymentStatus: 'paid'
          }
        }
        const result = await ordersColl.updateOne({ trackingId }, updatePaymentStatus);
        //? payment success history;
        const payments = {
          foodName: session.metadata.foodName,
          foodId: session.metadata.foodId,
          trackingId: session.metadata.trackingId,
          amountTotal: session.amount_total / 100,
          paymentStatus: session.payment_status,
          transactionId: session.payment_intent,
          customerEmail: session.customer_email,
          createdAt: new Date()
        }
        //? post payment succss histroy in paymensts coll;
        const resultPayments = await paymentsColl.insertOne(payments);
        return res.send({
          success: true,
          modifyPaymentStaust: result,
          paymentInfo: resultPayments,
          trackingId: trackingId,
          transactionId: session.payment_intent
        })

      }
      return res.send({ success: false })
    })
    //Todo admin all info get Platform Statistics Page showning;
    app.get('/admin-stats', async (req, res) => {
      const totalUsers =
        await usersColl.countDocuments()

      const pendingOrders =
        await ordersColl.countDocuments({
          orderStatus: 'pending'
        })


      const deliveredOrders =
        await ordersColl.countDocuments({
          orderStatus: 'delivered'
        })

      const payments = await paymentsColl.find().toArray();
      const totalPayment = payments.reduce(
        (sum, payment) => sum + payment.amountTotal,
        0
      );
      // console.log('totaluser',totalUsers,'pendingOrder',pendingOrders,'deliverEdOder',deliveredOrders,'total payment',totalPayment);
      res.send({
        totalUsers,
        pendingOrders,
        deliveredOrders,
        totalPayment
      })

    })



    //! vercel deploy first step;
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

