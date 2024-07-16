require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT;
const cors = require ("cors");
const mongoose = require("mongoose");

const{v4: uuidv4} = require("uuid")

//Auslesen connect string aus env variable
const connectString = process.env.MONGO_DB_CLIENT;

//Verbindung mit DB durch mongoose driver
//next Funktion um den nächsten handler zu übergeben(app.use(...))
app.use(async(req,res,next)=>{
    try{
        await mongoose.connect(connectString);
        console.log("Running connection");
        next();
    }
    catch(e){
        console.log("Running error")
    }
})


//Middleware handler
//Json nutzbar machwn
app.use(express.json());
//alle origins zulassen
app.use(cors());


//Schema erstellen für enstsprechende Collection
//Todo - todoSchema; user - user Schema
//notwendig: Datentypen mit jeweiligen properties
//Zusatz: required, default und weitere
const todoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category:{ 
        type: String,
        required: true
    },
    id: { 
        type: String,
        default: uuidv4,
        required: true
    },
    done: {
        type:Boolean,
        required: true
    },
});


//Model erstellen, damit methoden zum query nutzbar sind
//außerdem wird hier der collection Eintrag "todos24" in der DB angelegt
const Todo = mongoose.model("todos24",todoSchema);


//Default home route
app.get("/api",(req,res)=>{
    res.send("Hallo Welt");
});


//Test route
app.get("/api/health-check", (req, res)=>{
    res.status(200).send({message:"Running Backend works"})
    
});

//todos getter route
app.get("/api/todos", async(req, res )=>{
    try{
        //find query - https://mongoosejs.com/docs/api/model.html#Model.find()
        //filter {} gibt alle Objects zurück
        const todos = await Todo.find({});
        //sende todos mit entsprechender Nachricht an Frontend als response zurück
        res.status(201).send({todos: todos, message: "Fetched Todos"})
    }
    catch(e){
      
        res.status(500).send({message: "Could not fetch todos!"})
    }
})

//Todo add route
app.post("/api/addTodo", async(req, res)=>{
    try{
        //request schickt body mit todo daten, die wir extrathieren
        const todoToAdd= req.body;
        //create method - https://mongoosejs.com/docs/api/model.html#Model.create()
        await Todo.create(todoToAdd);
        //nur nachricht zurückschicken
        res.status(201).send({message:"Added new Todo!"})

    }
    catch (e){
        res.status(500).send({message: "could not add Todo"})
    }
});


//delete route um todos in der Datenbank mit der jeweiligen uuid (aus dem frontend mit request-url) um todo in der DB zu löschen
app.delete("/api/deleteTodo/:idParam", async(req, res)=>{
 
    try{
        const {idParam}=req.params;
       
        await Todo.deleteOne({id: idParam});
        res.status(201).send({message: "Deleted Todo!"})
    }
    catch(e){
        res.status(500).send({message: "Delete not work!"})
    }
})

//route um todo done Feld in der DB zu togglen (true<=>false)
//id wird durch url mitübergeben und in mit entsprechender query function wird 
//das todo aus der DB gefiltert
//done feld wird in der DB um den umzukehrenden Wert gesetzt
app.put("/api/toggleTodo/:idParam/",async(req,res)=>{
  
    try{
        const {idParam} =req.params;
   
        
        
        //todo raussuchen damit wir in (*) das done des jeweiligen todo nutzen können
        const todo = await Todo.findOne({id: idParam});
        if (!todo){
            return res.status(404).send({message: "Todo not found!"});
        }
        
        //Todo query und method  - https://mongoosejs.com/docs/api/model.html#Model.findOneAndUpdate()
        //es gibt viele Möglichkeiten dies zu tun z.B findByIdAndUpdate() - https://mongoosejs.com/docs/api/model.html#Model.findByIdAndUpdate()
        //$set ist ein mongodb operator - https://www.mongodb.com/docs/manual/reference/operator/update/
        await Todo.findOneAndUpdate(
            {id: idParam},
            {$set: {done: !todo.done}}//(*)
        )
        
        res.status(201).send({message: "Todo Updated!"});
    }
    catch(e){
        res.status(500).send({message: "Update did not work"});
    }
});

app.listen(port, ()=>{
    console.log(`Running on ${port}`)
});

