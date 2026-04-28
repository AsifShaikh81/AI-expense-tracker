import express from 'express'
import cors from 'cors'

const app = express()

app.use(express.json())
app.use(cors())

app.get('/',(req,res)=>{
    res.json({message:"Listening..."})
})

app.post('/chat',(req,res)=>{
    //* SSE(server sent event) - Sending to client
    // 1 ADD SPECIAL HEADER
    res.writeHead(200,{
        'Content-Type': 'text/event-stream'
    })

    const body = req.body
    console.log('query',body)

    // 2 SEND DATA IN SPECIAL FORMAT
    setInterval(()=>{
        res.write("event: my-custom-evt\n")
        res.write(`data:${body.QUER}\n\n`)
    },1000)


    // res.json({})
})

const port =  process.env.PORT || 3000
app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})