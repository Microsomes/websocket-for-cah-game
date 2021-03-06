const express = require("express")
const http= require("http")

const app = express();
const server = http.createServer(app);

const fs= require("fs")

const cors= require("cors");
const e = require("cors");


var _ = require('underscore');

app.use(cors())


var rooms={}

var activeUsers={}
//determines currently which room their in without delving too deep

var curRoomID=0;

 

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

    // new SeverManagement().init().then(dr=>{
    //     client.emit("init",dr);
    // })


    client.on("WAITINGMESSAGE",(msg)=>{
      var userid= msg.genid;
      var roomID= msg.roomID;
      var roomData= rooms[roomID];
      console.log(roomData['users'][userid])

      var toSend=msg;

      toSend.senderData=roomData['users'][userid]

      client.broadcast.emit("WAITINGMESSAGEres",{
        ...toSend
      })
    })

    client.on("joinRoom",(msg)=>{
      if(msg.action=="JOINROOM"){
        console.log(msg);
        var roomCode= parseInt(msg.data.roomCode);
        if(rooms[roomCode]!=undefined){
          console.log("room exists")

          if(rooms[roomCode].isAlreadyPlaying){
            //already playing- cant connect- or reconnect

            client.emit("joinRoomResponse",{
              status:"ERR",
              msg:"This room is currently playing/active so cannot join"
            })

            return;
          }

          activeUsers[client.id]={
            roomCode:roomCode,
            playerData:{
              nickName: msg.data.nickName,
              socketIDs:[client.id]
            }
          }

          if(rooms[roomCode]['users'][msg.data.genid]==undefined){
            rooms[roomCode]['users'][msg.data.genid]={
              playerData:{
                nickName: msg.data.nickName,
                socketIDs:[client.id]
              }
            }


            console.log("success")
            client.emit("joinRoomResponse",{
              status:"SUCCESS",
              data:{
                ...rooms[roomCode]
              },
              msg:"You are now in a room"
            })

            client.broadcast.emit("playerConnected",{
              roomID: roomCode,
              user:{
                nickName: msg.data.nickName,
                socketIDs:[client.id],
                connectedUsers:rooms[roomCode]['users'],//all connected users of this room
              }
            })
          }else{
            console.log("player exists")
           var socketsid= rooms[roomCode]['users'][msg.data.genid].playerData.socketIDs;

           socketsid.push(client.id)
        

           activeUsers[client.id]={
            roomCode:roomCode,
            playerData:{
              nickName: msg.data.nickName,
              socketIDs:socketsid
            }
          }
           
          rooms[roomCode]['users'][msg.data.genid]={
            playerData:{
              nickName: msg.data.nickName,
              socketIDs:socketsid
            }
          }

          client.broadcast.emit("playerConnected",{
            roomID: roomCode,
            user:{
              nickName: msg.data.nickName,
              socketIDs:socketsid,
              connectedUsers:rooms[roomCode]['users'],//all connected users of this room
            }
          })

        }

        
          


        }else{
          client.emit("joinRoomResponse",{
            status:"ERR",
            msg:"This room does not exist"
          })
        }
      }
    })

      client.on("createRoom",(msg)=>{
        console.log(msg)
        if(msg.action=="CREATEROOM"){
          //lets create a room
          curRoomID++;

          var dataR={
            roomID: curRoomID,
            socketIDsOwner: [client.id],
            nickname: msg.data.roomName,
            users:{},
            isAlreadyPlaying:false
          }

          rooms[curRoomID]=dataR;

          client.emit("roomCreated",dataR)

 
          
        }
      })

    
      var checkDisconnection=(id,client)=>{
        console.log("---------------disconnect");
        if(activeUsers[id]!=undefined){
          //we need to notify all rooms this player is no longer connected
          var roomCode= activeUsers[id].roomCode;

          var roomData= rooms[roomCode];

          for(var u in roomData['users']){
            var genid= u;

            var curUser= roomData['users'][genid]

            var fil= curUser.playerData.socketIDs.filter(i=>{
              if(i==id){
                return i
              }
            })

            if(fil.length>=1){
              //found user
              delete rooms[roomCode]['users'][genid]

              client.broadcast.emit("playerConnected",{
                roomID: roomCode,
                user:{
                  nickName: "dead",
                  socketIDs:[client.id],
                  connectedUsers:rooms[roomCode]['users'],//all connected users of this room
                }
              })

            }

          }
 

        }
      }
      
    client.on('disconnect', () => {
        console.log('user disconnected'+client.id);
        checkDisconnection(client.id,client)//runs any clean up that needs to take place and emits a broadcast to let the others know
      });
    });

    

server.listen(3000)