require('dotenv').config();
const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const JobCollection = client.db("Job-portal").collection("create-job-post");
    const JobApplied = client.db("Job-portal").collection("Job-applied");
    const userCollection = client.db("Job-portal").collection("user-collection");

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
    app.get('/JobList', async(req, res) =>{
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