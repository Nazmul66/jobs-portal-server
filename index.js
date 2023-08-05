require('dotenv').config();
const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 4000;


app.use(express.json());
app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.rnkzyeb.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJwt = (req, res, next) =>{
    // console.log("hitting data");
    // console.log(req.headers.authorization)
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({ error: "true", message: "unauthorized" })
    }
    const token = authorization.split(" ")[1]
    // console.log("get token",token)
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
         if(err){
            return res.status(403).send({ error: "true", message: "forbidden" })
         }
         req.decoded = decoded;
         next();
    })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const JobCollection = client.db("Job-portal").collection("create-job-post");
    const JobApplied = client.db("Job-portal").collection("Job-applied");
    const userCollection = client.db("Job-portal").collection("user-collection");


    // create json web token
    app.post("/jwt", async(req, res) =>{
        const user = req.body;
        console.log(user)

        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1h"
        })
        res.send({token});
    })

      // components ->  PostJob has been fetch the data
      app.post("/jobPost", async(req, res) =>{
        const body = req.body;
        const result = await JobCollection.insertOne(body);
        res.send(result);
      })

    // components -> JobList_section has been fetch the data
    app.get("/jobData", async(req, res) =>{
        const result = await JobCollection.find().toArray();
        res.send(result);
    })

    // components -> Job_Details has been fetch the data
    app.get('/jobData/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await JobCollection.findOne(query);
        res.send(result);
    })

    // components -> Job_Details has been fetch the data
    app.post('/jobApply', async(req, res) =>{
       const user = req.body;
       const id = { jobId : user.jobId }
      //  console.log(id)
       const existingUser = await JobApplied.findOne(id);
       if(existingUser){
          return res.send({message: "same job can't apply twice"})
       }
       else{
         const result = await JobApplied.insertOne(user);
         res.send(result);
       }
    })

    // components -> JobList has been fetch the data
    app.get('/JobList', verifyJwt, async(req, res) =>{
       const decoded = req.decoded;
      //  console.log(decoded)

      if(decoded.email !== req.query.email){
          return res.status(403).send({ error: "true", message: "forbidden" })
      }

       const query = req.query.email;
       const email = { Email : query}
       const result = await JobApplied.find(email).toArray();
       res.send(result);
   })

   // components -> JobList has been fetch the data
   app.delete('/jobDelete/:id', async(req, res) =>{
     const id = req.params.id;
     const query = {_id : new ObjectId(id)} 
     const result = await JobApplied.deleteOne(query);
     res.send(result)
  })

  // components -> Login page has been fetch the data
  app.post("/userData", async(req, res) =>{
     const body = req.body;
     const email = { email : body.email }
     const existingEmail = await userCollection.findOne(email);
     if(existingEmail){
        return res.send({ message: "already exist" })
     }
     else{
      const result = await userCollection.insertOne(body);
      res.send(result);
     }
  })

  //  components -> EditJobPost page has been fetch the data Get Method
   app.get("/updateData/:id", async(req, res) =>{
      const id = req.params.id;
      const query = { _id : new ObjectId(id) }
      // console.log( id )
      const result =  await JobCollection.findOne(query);
      res.send(result)
   })

   // components -> EditJobPost page has been fetch the data Get Method
   app.put("/updatePost/:id", async(req, res) =>{
    const updateItem = req.body;
    const id = req.params.id;
    // console.log(body, id);
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
      const updatePost = {
        $set: {
          position             :  updateItem.position,
          time                 :  updateItem.time,
          company              :  updateItem.company,
          image                :  updateItem.image,
          qualification        :  updateItem.qualification,
          Experience           :  updateItem.Experience,
          Location             :  updateItem.Location,
          Job_Description      :  updateItem.Job_Description,
          Salary               :  updateItem.Salary,
          Working              :  updateItem.Working,
          company_website      :  updateItem.company_website,
          Experience_level     :  updateItem.Experience_level,
          post_Date            :  updateItem.post_Date,
        }
   };
   const result = await JobCollection.updateOne(filter, updatePost, options);
   res.send(result);
 })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})