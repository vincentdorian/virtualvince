import { type NextPage } from "next";
import Head from "next/head";
import { createContext, useState, useContext, type FC, type FormEvent } from "react";
import { api } from "~/utils/api";

type MessageType = {
  content: string;
  role: string;
};

const MessagesContext = createContext<Array<MessageType>>(
  [] as Array<MessageType>
);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const SetMessagesContext = createContext((_messages: Array<MessageType>) => {});

const PushChatMessageForm: FC<React.HTMLAttributes<HTMLDivElement>> = ({...props}) => {
  const [message, setMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const messages = useContext(MessagesContext);
  const setMessages = useContext(SetMessagesContext);

  const sendChatMessage = api.chat.example.useMutation();

  const maxLength = 200;
  const minLength = 10;

  const handleSubmit = async () => {
    if (message.length > minLength) {
      messages.push({ content: message, role: "user" });
      setMessages([...messages]);
    } else {
      return;
    }

    setMessage("");
    setIsTyping(false);

    await sendChatMessage
      .mutateAsync({
        role: "user",
        content: message,
      })
      .then((response) => {
        if (response) {
          messages.push(response);
          setMessages([...messages]);
        }
      });
  };

  const handleInput = (e: FormEvent<HTMLTextAreaElement>) => {
    setMessage(e.currentTarget.value);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  return (
    <form className={`w-full flex flex-col ${props.className ?? ""}`}>
      <span className="flex-none text-sm">{isTyping ? "Typing..." : ""}</span>
      <div className="w-full flex-1 flex flex-row rounded-xl bg-neutral-100 p-3 text-neutral-600 shadow-sm">
        <textarea
          rows={
            message.split(/\r|\n/).length > 3
              ? message.split(/\r|\n/).length
              : 3
          }
          className="flex-1 border-none bg-transparent focus:outline-none"
          value={message}
          onInput={(e) => handleInput(e)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSubmit();
            }
          }}
        />

        <div className="flex h-full flex-col items-end justify-between">
          <button className="rounded-md bg-blue-500 text-white text-sm px-3 py-1.5 disabled:cursor-not-allowed disabled:bg-blue-300" disabled={ message.length > maxLength ||  message.length < minLength}>
            Send
          </button>
          <span
            className={`text-sm leading-none ${
              message.length > maxLength ? "text-red-500" : "text-neutral-400"
            }`}
          >
            {" "}
            {message.length.toString() + "/" + maxLength.toString()}{" "}
          </span>
        </div>
      </div>
    </form>
  );
};

const ChatMessages: FC<React.HTMLAttributes<HTMLFormElement>> = ({...props}) => {
  const messages = useContext(MessagesContext);

  return (
    <div className={`flex flex-col gap-y-3 ${props.className ?? ""}`}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`rounded-2xl px-6 py-4 shadow-sm text-sm md:text-base ${
            message.role === "assistant"
              ? "mr-32 bg-neutral-200 text-neutral-900"
              : "ml-32 bg-blue-500 text-white"
          }`}
        >
          {message.content}
        </div>
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const [messages, setMessages] = useState<Array<MessageType>>([
    {
      content: "Hi, I am VirtualVince. How can I help you?",
      role: "assistant",
    },
  ]);

  return (
    <>
      <Head>
        <title>VirtualVince</title>
        <meta name="description" content="Hi I am VirtaulVince. Let's chat." />
      </Head>
      <main className="mx-auto flex h-screen max-w-3xl flex-col bg-white p-5 md:px-0">
        <div className="flex-none">
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl md:text-4xl">
            VirtualVince
          </h1>
          <p className="text-sm text-neutral-800 sm:text-base">
            This is VirtualVince, a simple chat bot that you can talk to find
            out a few things about me and what I do. It is built with NextJS,
            Tailwindcss, tRPC, Typescipt and the OpenAI chat completion AI.
          </p>
        </div>
        <MessagesContext.Provider value={messages}>
          <SetMessagesContext.Provider value={setMessages}>
            <ChatMessages className="flex-1 overflow-y-auto my-5" />
            <PushChatMessageForm className="flex-none"/>
          </SetMessagesContext.Provider>
        </MessagesContext.Provider>
      </main>
    </>
  );
};

export default Home;
