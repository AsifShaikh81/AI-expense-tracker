import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { StreamMessage } from "../type.ts";
import { BadgeDollarSign, BrainCircuit, BrainCog, CircleDollarSign, PiggyBank } from "lucide-react";


export function ChatContainer() {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const scrollref = useRef<HTMLDivElement>(null)

  useEffect(()=>{
  scrollref.current?.scrollIntoView({behavior:'smooth'})
  },[messages])

  //* SSE((server sent event)) - recciving on clinet side

   //* library
    async function submitQuery(userInput:string) {
      setMessages((prevMessages)=>{
        return [
          ...prevMessages,
          {
            type:'user', 
            payload:{text:userInput},
            id:Date.now().toString(),
          }
        ]
      })
      await fetchEventSource("http://localhost:3000/chat", {
        onmessage(ev) {
          // console.log(ev.event)
          // console.log(ev.data);
           const parsedData = JSON.parse(
          ev.data
        ) as StreamMessage;

        if (parsedData.type === 'ai') {
          setMessages((prevMessages) => {
            const lastMessage =
              prevMessages[prevMessages.length - 1];

            if (lastMessage && lastMessage.type === 'ai') {
              // append to lat message
              const clonedMessages = [...prevMessages];

              clonedMessages[clonedMessages.length - 1] = {
                ...lastMessage,
                payload: {
                  text:
                    lastMessage.payload.text +
                    parsedData.payload.text,
                },
              };

              return clonedMessages;
            } else {
              return [
                ...prevMessages,
                {
                  id: Date.now().toString(),
                  type: 'ai',
                  payload: parsedData.payload,
                },
              ];
            }
          });

          // console.log(parsedData);
        } 
         else if (parsedData.type === 'toolCall:start') {
          setMessages((prevMessages) => {
            return [
              ...prevMessages,
              {
                id: Date.now().toString(),
                type: 'toolCall:start',
                payload: parsedData.payload,
              },
            ];
          });
        } else if (parsedData.type === 'tool') {
          setMessages((prevMessages) => {
            return [
              ...prevMessages,
              {
                id: Date.now().toString(),
                type: 'tool',
                payload: parsedData.payload,
              },
            ];
          });
        }
        

        },
        method: "POST",
        body: JSON.stringify({ QUER: userInput }),
        headers: {
          "content-type": "application/json",
        },
      });
    }
/*   useEffect(() => {
   

    

     const evtSource = new EventSource(
    'http://localhost:3000/chat'
  )

  evtSource.addEventListener('open',()=>{
    console.log('connection open')
  })
  evtSource.addEventListener('message',(data)=>{
    console.log('Received message:', data )
  })

  evtSource.addEventListener('my-ping',(eventName)=>{
    console.log('Received custom event: ', eventName)
  }) 
  }, []); */

  function Submit(userInput: string) {
    // console.log("userInput", userInput);
    submitQuery(userInput);

  }
  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl w-full">
        <div className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br flex items-center justify-center shadow-lg  from-[#f59e0b] to-[#ef4444]">
              {/* <BrainCog /> */}
              {/* <BrainCircuit className="text-white" /> */}
              {/* <BadgeDollarSign /> */}
              <CircleDollarSign className="text-white"/>

            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">
                AI Expense Tracker
              </h1>
              <p className="text-xs text-zinc-500">Powered by advanced AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="w-full max-w-5xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6 py-8">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#f59e0b] to-[#ef4444] flex items-center justify-center shadow-2xl mb-6 animate-pulse">
              <CircleDollarSign className="text-white w-10 h-10"/>

              </div>
              <h2 className="text-3xl font-bold text-zinc-100 mb-3">
                How can I help you today?
              </h2>
              <p className="text-zinc-500 text-center max-w-md mb-8">
                Ask me anything, and I'll do my best to assist you with
                information, analysis, and creative solutions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                {[
                  {
                    icon: "💡",
                    title: "Get ideas",
                    desc: "Brainstorm creative solutions",
                  },
                  {
                    icon: "📊",
                    title: "Analyze data",
                    desc: "Extract insights from information",
                  },
                  {
                    icon: "✍️",
                    title: "Write content",
                    desc: "Create engaging text and copy",
                  },
                  {
                    icon: "🔧",
                    title: "Solve problems",
                    desc: "Find answers to your questions",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/50 hover:border-purple-500/50 transition-all cursor-pointer group"
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-sm font-medium text-zinc-200 group-hover:text-purple-400 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {/* Messages will be displayed here... */}
              {messages.map((message)=>{
                return (
                  <div key={message.id}>
                    <ChatMessage message={message}/>

                  </div>
                )
              })}
              <div ref={scrollref}>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 w-full">
        <ChatInput Submit={Submit} />
      </div>
    </div>
  );
}
