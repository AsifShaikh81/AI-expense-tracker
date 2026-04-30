import express from 'express'
import cors from 'cors'
import { agent } from './src/agent'
import type { StreamMessage } from './src/type'

const app = express()

app.use(express.json())
app.use(cors())

app.get('/',(req,res)=>{
    res.json({message:"Listening..."})
})

app.post('/chat', async (req, res) => {
  // SSE
  // 1. Add special header
  // 2. Send data in special format

  const { query } = req.body;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
  });

  const response = await agent.stream(
    {
      messages: [
        {
          role: 'user',
          content: query,
        },
      ],
    },
    {
      streamMode: ['messages', 'custom'],
    //todo: generate dynamically
      configurable: { thread_id: '1' },
    }
  );

  for await (const [eventType, chunk] of response) {
    console.log('eventtype: ', eventType);
    let message: StreamMessage = {} as StreamMessage;

    if (eventType === 'custom') {
      console.log('chunk', chunk);
      message = chunk;
    } else if (eventType === 'messages') {
      if (chunk[0].content === '') continue;

      const messageType = chunk[0].type;
      if (messageType === 'ai') {
        message = {
          type: 'ai',
          payload: { text: chunk[0].content as string },
        };
      } else if (messageType === 'tool') {
        message = {
          type: 'tool',
          payload: {
            name: chunk[0].name!,
            result: JSON.parse(chunk[0].content as string),
          },
        };
      }
    }

    res.write(`event: ${eventType}\n`);
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  }

  // setInterval(() => {
  //   res.write('event: cgPing\n')
  //   res.write(`data: ${body?.query}\n\n`)
  // }, 1000)

  res.end();
});



const port =  process.env.PORT || 3000
app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})