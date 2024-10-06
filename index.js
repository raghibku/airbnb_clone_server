const { parse } = require('date-fns');
const express = require('express');
const app = express();
const cors = require('cors')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

//middleware
app.use(cors())
app.use(express.json());

//mongo
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pwytamz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

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
        // Get the database and collection on which to run the operation
        const propertyCollection = client.db("airbnbCloneDB").collection("properties");


        //find all
        app.get('/properties', async (req, res) => {
            const cursor = propertyCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/searchedProperties', async (req, res) => {
            const country = req.query.country
            const tagg = req.query.tagg
            const adults = parseInt(req.query.adults, 10) || 0;
            const children = parseInt(req.query.children, 10) || 0;
            const pets = parseInt(req.query.pets, 10) || 0;

            // Parse check-in and check-out dates from the query
            const checkInDate = req.query.checkInDate ? parse(req.query.checkInDate, 'MM/dd/yyyy', new Date()) : null;
            const checkOutDate = req.query.checkOutDate ? parse(req.query.checkOutDate, 'MM/dd/yyyy', new Date()) : null;

            const min_price = parseFloat(req.query.min_price) || 0;
            const max_price = parseFloat(req.query.max_price) || Infinity; 
            const type_of_place = req.query.type_of_place || ""; 


            console.log(req.query)
            const query = {};
            if (country && country !== "") {
                query.country_location = country;
            }
            if (tagg && tagg !== "") {
                query.tags = { $in: [tagg] };
            }
            // Apply filtering based on adults, children, and pets
            query.max_adult = { $gte: adults }; 
            query.max_baby = { $gte: children };
            query.max_pet = { $gte: pets }; 

            if (checkInDate && checkOutDate) {
                query.$expr = {
                    $and: [
                        {
                            $lte: [
                                { $dateFromString: { dateString: "$vacancy_start", format: "%m/%d/%Y" } },
                                checkInDate
                            ]
                        },
                        {
                            $gte: [
                                { $dateFromString: { dateString: "$vacancy_end", format: "%m/%d/%Y" } },
                                checkOutDate
                            ]
                        }
                    ]
                };
            }

            // Price range filter
            query.price = { $gte: min_price, $lte: max_price };

            // Type of place filter
            if (type_of_place && type_of_place !== "") {
                query.type_of_place = type_of_place;
            }

            const result = await propertyCollection.find(query).toArray();
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);

//mongo

app.get('/', (req, res) => {
    res.send('airbnb clone server is running')
})

app.listen(port, () => {
    console.log(`airbnb clone serveris running at port ${port}`)
})

