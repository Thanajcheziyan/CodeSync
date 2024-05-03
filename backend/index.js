const express = require('express');
const cors = require('cors');
const app = express();
var compiler = require('compilex');
var options = {stats : true}; //prints stats on console 
compiler.init(options);

app.use(cors());
app.use(express.json());

app.post('/runpy', async(req, res) => {
    
  const input=req.body.input;
    const code = req.body.code;
var envData = { OS : "windows"}; 

compiler.compilePythonWithInput( envData , code , input ,  function(data){
    res.send(data.output); 
    console.log(data.output);       
});  
});

app.post('/run',async(req,res)=>{
    const code=req.body.code;
    const option=req.body.option;
    const input=req.body.input;
    if(option=='3'){
        var envData = { OS : "windows"};
        compiler.compileJavaWithInput( envData , code , input ,  function(data){
            
            res.type('text/plain').send(data.output);
            
        }); 
    }
    else{
    var envData = { OS : "windows" , cmd : "g++"};
    compiler.compileCPP(envData , code , function (data) {
        res.send(data.output);
       
    });}
});

app.listen(8000, () => {
    console.log(`Server is running on port 8000.`);
  });