const express = require('express');

const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;

const app = express();
require('dotenv').config()




// middleware
app.use(express.json())
app.use(cors())






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6h4mfox.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT (req, res, next){
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('unauthorized access');

  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({message: 'forbidden access'})
    }
    req.decoded = decoded;
    next()
  })
}



async function run() {
    try {
      const userCollections = client.db("focus").collection("userCollection");
      const productsCategory = client.db("focus").collection("categorylist");
      const productCollections = client.db("focus").collection("products");
      const advertiseCollections = client.db("focus").collection("advertiseCollection")

      const orderCollection = client.db("focus").collection("orders");
      console.log(`mongodb server is working `);

      // admin verification

      async function verifyAdmin(req, res, next) {
        const decodedEmail = req.decoded.email;
        const query = { email: decodedEmail };
        const user = await userCollections.findOne(query);
        if (user?.role !== "admin") {
          return res.status(403).send({ message: "forbidden access" });
        }
        // console.log(decodedEmail);
        next();
      }

      // category list
      app.get("/category", async (req, res) => {
        const query = {};
        const options = await productsCategory.find(query).toArray();
        res.send(options);
      });

      //  products API by category ID
      app.get("/category/:id", async (req, res) => {
        const id = req.params.id;
        const query = { categoryId: id };

        const matching = await productCollections.find(query).toArray();
        res.send(matching);
      });

      // all products

      app.get("/products", async (req, res) => {
        const query = {};
        const result = await productCollections.find(query).toArray();
        res.send(result);
      });

      // Add product API

      app.post("/products", async (req, res) => {
        const product = req.body;
        console.log(product);
        const result = await productCollections.insertOne(product);
        res.send(result);
      });

      // user add to db
      app.put("/user/:email", async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result = await userCollections.updateOne(
          filter,
          updateDoc,
          options
        );

        // const token = jwt.sign(user, process.env.JWT_TOKEN, {
        //   expiresIn: '1d',
        // })
        // console.log(token);
        res.send({ result });
      });

      // all users

      app.get("/users", async (req, res) => {
        const query = {};
        const users = await userCollections.find(query).toArray();
        res.send(users);
      });

      // delete users
      app.delete(
        "/users/:id([0-9a-fA-F]{24})",
        verifyJWT,
        verifyAdmin,
        async (req, res) => {
          const id = req.params.id;

          const filter = { _id: ObjectId(id) };
          const result = await userCollections.deleteOne(filter);
          res.send(result);
        }
      );
      app.get("/users/buyers", async (req, res) => {
        const role = req.params.role;
        const query = { role: role };
        const buyer = await userCollections.find(query).toArray();
        res.send(buyer);
      });

      // seller list

      app.get("/users/sellers", verifyJWT, verifyAdmin, async (req, res) => {
        const role = req.params.role;
        const query = { role: role };
        const seller = await userCollections.find(query).toArray();
        res.send(seller);
      });

      // verify a seller

      app.put("/users/verify/:id", verifyJWT, verifyAdmin, async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            verified: true,
          },
        };
        const result = await userCollections.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      });

      // admin routes

      app.get("/users/admin/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const user = await userCollections.findOne(query);

        res.send({ isAdmin: user?.role === "admin" });
      });

      // admin making

      app.put("/users/admin/:id", verifyJWT, async (req, res) => {
        const decodedEmail = req.decoded.email;
        const query = { email: decodedEmail };
        const user = await userCollections.findOne(query);
        if (user?.role !== "admin") {
          return res.status(403).send({ message: "forbidden access" });
        }
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await userCollections.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      });

      // send token

      app.get("/jwt", async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const user = await userCollections.findOne(query);

        if (user) {
          const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
            expiresIn: "10d",
          });
          return res.send({ accessToken: token });
        }

        res.status(403).send({ accessToken: "" });
      });

      // booking

      app.post("/orders", async (req, res) => {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.send(result);
      });

      // my orders

      app.get("/myorders", verifyJWT, async (req, res) => {
        const email = req.query.email;

        const decodedEmail = req.decoded.email;

        if (email !== decodedEmail) {
          return res.status(403).send({ message: "forbidden access" });
        }
        const query = { email: email };
        const myorders = await orderCollection.find(query).toArray();
        res.send(myorders);
      });

      // products added by seller

      
          app.get("/product", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const myproduct = await productCollections.find(query).toArray();
            res.send(myproduct);
          });

      // advertisement section


      app.post("/seller/advertise", verifyJWT, async (req, res) => {
        const advProduct = req.body;
       
        const result = await advertiseCollections.insertOne(advProduct);
        res.send(result);
      });


      // get advertised Product

      
      app.get("/seller/advertise", async (req, res) => {
        const query = {};
        const result = await advertiseCollections.find(query).toArray();
        res.send(result);
      });

      // advertise deteting


      app.delete(
        "/seller/advertise/:id([0-9a-fA-F]{24})",
        verifyJWT,
        async (req, res) => {
          const id = req.params.id;
          // console.log(id);
          const query = { _id: ObjectId(id) };
          const result = await advertiseCollections.deleteOne(query);
          res.send(result);
        }
      );
    }
    finally {
        
    }

}

run().catch(err=> console.error(err))

app.get("/", (req, res) => {
  res.send("Camera Resale Server is running ....... in ");
});


app.listen(port, () => {
    console.log(`Camera Resale Server is running at ${port}`);
})


// const userCollection = client.db("focus").collection("userCollection");