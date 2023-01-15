const express = require('express');
const bodyParser = require('body-parser'); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//Screen Checking
app.get('/', (req, res) => {
    res.send('Hello World!')
  })

//Middleware
app.use(cors());
app.use(express.json());

//Verify firebase token
var serviceAccount = require("./configs/react-node-eshop-firebase-adminsdk-5kpai-29c0eb454e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gzywsel.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const productCOllection = client.db('eShop').collection('products');
        //const historyCOllection = client.db('eShop').collection('history');
        const orderHistoryCOllection = client.db('eShop').collection('orderHistory');
        
        app.get('/showProducts', async(req, res) => {
            const query = {};
            const cursor = productCOllection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        app.get('/showHistory', async(req, res) => {
            const bearer = req.headers.authorization;
            if(bearer && bearer.startsWith('Bearer ')){
                idToken = bearer.split(' ')[1];
                admin.auth().verifyIdToken(idToken)
                .then(async function (decodedToken){
                    const tokenEmail = decodedToken.email;
                    if(tokenEmail == req.query.email){
                        const cursor = orderHistoryCOllection.find({customerEmail: req.query.email});
                        const history = await cursor.toArray();
                        //const history = cursor.toArray();
                        res.status(200).send(history);
                    }
                    else{
                        res.status(401).send('Un-authorized acccess');
                    }
                }).catch(function (error){
                    res.status(401).send('Un-authorized acccess');
                });
            }
            else{
                res.status(401).send('Un-authorized acccess');
            }
        });

        app.post('/addProducts', async(req, res) => {
            const product = req.body;
            const result = await productCOllection.insertOne(product);
            res.send(result);
        });

        app.post('/addHistory', async(req, res) => {
            const history = req.body;
            const result = await historyCOllection.insertOne(history);
            res.send(result);
        });

        app.post('/addOrderHistory', async(req, res) => {
            const orderHistory = req.body;
            const result = await orderHistoryCOllection.insertOne(orderHistory);
            res.send(result);
        });
        
        app.delete('/showProducts/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await productCOllection.deleteOne(query);
            res.send(result);
            //console.log('Trying to delete an item: ', id);
        });
    }
    finally{

    }
}
run().catch(err => console.log(err));

app.listen(port);
