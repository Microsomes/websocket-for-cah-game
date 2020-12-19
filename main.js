const express = require("express")
const http= require("http")

const app = express();
const server = http.createServer(app);

const fs= require("fs")

const cors= require("cors");


app.use(cors())

class SeverManagement{
    async init(){
        return new Promise((resolve,reject)=>{
        //user just connected lets make him confortable
        var loadCategories= require("./data/names.json")
        resolve(loadCategories)
    })
    }
}


// server-side
const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: false
    }
  });

  io.on("connection", (client) => {
    console.log(client.id)
    console.log("Connected!");

    new SeverManagement().init().then(dr=>{
        client.emit("init",dr);
    })

 
        console.log("sending client a message")
        setTimeout(()=>{}, 3000);

    

 
    client.on('disconnect', () => {
        console.log('user disconnected'+client.id);
      });
    });

    

server.listen(3000)