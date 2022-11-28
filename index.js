const express = require('express');

const cors = require('cors');
const { MongoClient, ServerApiVersion } = require("mongodb");
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

function veriFyJwt (req, res, next){
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('unauthorized access');

  }
  const token = authHeader.splite('')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({message: 'forbidden access'})
    }
    req.decoded = decoded;
    next
  })
}

async function run() {
    try {
      const userCollections = client.db("focus").collection("userCollection");
      const productsCategory = client
        .db("focus")
        .collection("categorylist");
      const productCollections = client.db("focus").collection("products");

      const orderCollection = client.db("focus").collection("orders")
      console.log(`mongodb server is working `);
     
      
      
      // category list 
      app.get("/category", async (req, res) => {
        const query = {};
        const options = await productsCategory.find(query).toArray();
        res.send(options);
      });


      //  products API by category ID
      app.get("/category/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        const query = { categoryId: id };
       
        const matching = await productCollections.find(query).toArray();
        res.send(matching);
      });


      // user add to db 
      app.put('/user/:email', async (req, res) => {
        const email = req.params.email
        const user = req.body
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,

        }
        const result = await userCollections.updateOne(filter, updateDoc, options)
        

        // const token = jwt.sign(user, process.env.JWT_TOKEN, {
        //   expiresIn: '1d',
        // })
        // console.log(token);
        res.send({result})
            
      })

      // send token 
      app.get('/jwt', async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const user = await userCollections.findOne(query)
        if (user) {
          const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
          return res.send({accessToken: token})
        }
       
        res.status(403).send({accessToken:''})
      })

      // booking

      app.post('/orders', async (req, res) => {
        const order = req.body
        const result = await orderCollection.insertOne(order)
        res.send(result)
      });

      // my orders

      app.get('/myorders', veriFyJwt, async (req, res) => {
        const email = req.query.email;
        const decodedEmail = req.decoded.email;

        if (email !== decodedEmail) {
          return res.status(403).send({message: 'forbidden access'})
        }
        const query = { email: email }
        const myorders = await orderCollection.find(query).toArray();
        res.send(myorders);
      })


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