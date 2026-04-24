import express from 'express'
import cors from 'cors'

const app = express()

app.use(express.json())
app.use(cors())

app.get('/',(req,res)=>{
    res.json({message:"Listening..."})
})

app.get('/chat',(req,res)=>{
    //SSE
    // 1 ADD SPECIAL HEADER
    res.writeHead(200,{
        'Content-Type': 'text/event-stream'
    })
    // 2 SEND DATA IN SPECIAL FORMAT
    setInterval(()=>{
        res.write('event: lelelel\n')
        res.write('data:Happy coding/n/n')
    },1000)


    res.json({})
})

const port =  process.env.PORT || 3000
app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})