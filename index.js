import { Express } from "express";
import bodyParser from "body-parser";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import cors from "cors";
import admin from "firebase-admin";

require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//Screen Checking
app.get("/", (req, res) => {
  res.send("Hello World!");
});

//Middleware
app.use(cors());
app.use(express.json());

//Verify firebase token
var serviceAccount = require("./configs/se-palvelut-firebase-adminsdk-rkbgd-b52356937a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gzywsel.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const serviceCollection = client
      .db("cleaningServices")
      .collection("services");
    const orderHistoryCOllection = client
      .db("cleaningServices")
      .collection("orderHistory");

    app.get("/showServices", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/showHistory", async (req, res) => {
      const bearer = req.headers.authorization;
      if (bearer && bearer.startsWith("Bearer ")) {
        idToken = bearer.split(" ")[1];
        admin
          .auth()
          .verifyIdToken(idToken)
          .then(async function (decodedToken) {
            const tokenEmail = decodedToken.email;
            if (tokenEmail == req.query.email) {
              const cursor = orderHistoryCOllection.find({
                customerEmail: req.query.email,
              });
              const history = await cursor.toArray();
              //const history = cursor.toArray();
              res.status(200).send(history);
            } else {
              res.status(401).send("Un-authorized acccess");
            }
          })
          .catch(function (error) {
            res.status(401).send("Un-authorized acccess");
          });
      } else {
        res.status(401).send("Un-authorized acccess");
      }
    });

    app.post("/addServices", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.post("/addHistory", async (req, res) => {
      const history = req.body;
      const result = await orderHistoryCOllection.insertOne(history);
      res.send(result);
    });

    app.post("/addOrderHistory", async (req, res) => {
      const orderHistory = req.body;
      const result = await orderHistoryCOllection.insertOne(orderHistory);
      res.send(result);
    });

    app.delete("/showServices/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
      //console.log('Trying to delete an item: ', id);
    });
  } finally {
  }
}
run().catch((err) => console.log(err));

app.listen(port);
