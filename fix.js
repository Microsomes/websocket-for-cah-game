const fs= require("fs")
const cah= require("./cah-cards-full.json")


var allNames=[]



for(c in cah){
    var cur=cah[c].name;
    
    var black = cah[c].black;
    var white = cah[c].white;

    var data={
        name:cur,
        black:black,
        white:white
    }
    console.log(data)
  fs.writeFileSync("data/cards/"+cur.split(" ")[0]+".json",JSON.stringify(data,null,2));

    allNames.push(cur)
}

fs.writeFile("names.json",JSON.stringify(allNames,null,2),(err)=>{})
fs.writeFile("cah.json",JSON.stringify(cah,null,2),(err)=>{})

