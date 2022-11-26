const express = require('express');

const cors = require('cors');
const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 5000;

const app = express();
require('dotenv').config()

const sellers = require('./sellers.json')


// middleware
app.use(express.json())
app.use(cors())






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6h4mfox.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
      const userCollections = client.db("focus").collection("userCollection");
      const productsCategory = client
        .db("focus")
        .collection("categorylist");
      const productCollections = client.db("focus").collection("products");
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
        console.log(query);
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
        console.log(result)

        // const token = jwt.sign(user, process.env.JWT_TOKEN, {
        //   expiresIn: '1d',
        // })
        // console.log(token);
        res.send({result})
            
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