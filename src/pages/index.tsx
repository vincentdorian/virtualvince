import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import {
  createContext,
  useState,
  useContext,
  type FC,
  type FormEvent,
  useRef,
  useEffect,
} from "react";
import { api } from "~/utils/api";

type MessageType = {
  content: string;
  role: "user" | "assistant";
};

const MessagesContext = createContext<Array<MessageType>>(
  [] as Array<MessageType>
);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const SetMessagesContext = createContext((_messages: Array<MessageType>) => {});

const ProcessingContext = createContext<boolean>(false);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const SetProcessingContext = createContext((_processing: boolean) => {});

const TokenCountContext = createContext<number>(0);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const SetTokenCountContext = createContext((_tokenCount: number) => {});

const PushChatMessageForm: FC<React.HTMLAttributes<HTMLFormElement>> = ({
  ...props
}) => {
  const [message, setMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const messages = useContext(MessagesContext);
  const setMessages = useContext(SetMessagesContext);

  const isProcessing = useContext(ProcessingContext);
  const setIsProcessing = useContext(SetProcessingContext);

  const setTokenCount = useContext(SetTokenCountContext);

  const sendChatMessage = api.chat.send.useMutation();

  const isTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const maxLength = 200;
  const minLength = 10;

  const handleSubmit = async () => {
    const messagesProxy = messages;

    if (
      message.length > minLength &&
      message.length <= maxLength &&
      !isProcessing
    ) {
      messagesProxy.push({ content: message, role: "user" });
      setMessages([...messagesProxy]);
    } else {
      if (message.length < minLength) {
        alert("Message is too short");
      }

      if (message.length > maxLength) {
        alert("Message is too long");
      }

      if (isProcessing) {
        alert("Wait for Virtual Vince to answer");
      }

      return;
    }

    setMessage("");
    setIsTyping(false);

    setTimeout(() => {
      setIsProcessing(true);
    }, 750);

    await sendChatMessage
      .mutateAsync({ messages: messagesProxy })
      .then((response) => {
        if (response) {
          messagesProxy.push(response.message as MessageType);
          setTokenCount(response.total_tokens as number);
          setMessages([...messagesProxy]);
          setIsProcessing(false);
        }
      });
  };

  const handleInput = (e: FormEvent<HTMLTextAreaElement>) => {
    setMessage(e.currentTarget.value);
    setIsTyping(true);

    if (isTypingTimerRef.current) clearTimeout(isTypingTimerRef.current);

    isTypingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  return (
    <form
      className={`flex w-full flex-col ${props.className ?? ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <span className="h-6 flex-none text-sm">
        {isTyping ? "Typing..." : ""}
      </span>
      <div className="flex w-full flex-1 flex-row gap-x-2 rounded-xl bg-neutral-100 p-3 text-neutral-600 shadow-sm">
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
          <button
            className="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={message.length > maxLength || message.length < minLength}
          >
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

const ChatMessages: FC<React.HTMLAttributes<HTMLUListElement>> = ({
  ...props
}) => {
  const messages = useContext(MessagesContext);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const processing = useContext(ProcessingContext);

  useEffect(() => {
    if (scrollTargetRef.current) {
      scrollTargetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  });

  return (
    <ul className={`flex flex-col gap-y-3 ${props.className ?? ""}`}>
      {messages.map((message, index) => (
        <li key={index} className="flex w-full flex-row items-end gap-x-2">
          {message.role === "assistant" && (
            <div className="object-fit relative block h-10 w-10 flex-none overflow-hidden rounded-full bg-neutral-200">
              <Image
                src={
                  "https://avatars.githubusercontent.com/u/60883844?s=400&u=66e9c48042a0b2f25cfc3704772659c7de39af7e&v=4"
                }
                alt="Assistant"
                fill
                priority
              />
            </div>
          )}
          <div
            className={`prose flex-1 break-words rounded-2xl px-6 py-4 text-sm shadow-sm md:text-base ${
              message.role === "assistant"
                ? "mr-16 bg-neutral-200 text-neutral-900 sm:mr-32"
                : "ml-16 bg-blue-500 text-white sm:ml-32"
            }`}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </li>
      ))}
      {processing && (
        <li className="flex w-full flex-row items-end gap-x-1">
          <div className="object-fit relative block h-10 w-10 flex-none overflow-hidden rounded-full bg-neutral-200">
            <Image
              src={
                "https://avatars.githubusercontent.com/u/60883844?s=400&u=66e9c48042a0b2f25cfc3704772659c7de39af7e&v=4"
              }
              alt="Assistant"
              fill
              priority
            />
          </div>
          <div
            className={`mr-14 w-fit rounded-2xl bg-neutral-200 px-6 py-4 text-sm text-neutral-900 shadow-sm sm:mr-32 md:text-base`}
          >
            <div className="flex animate-pulse gap-x-1">
              <div className="h-2 w-2 rounded-full bg-gray-500"></div>
              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
              <div className="h-2 w-2 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </li>
      )}
      <div ref={scrollTargetRef}></div>
    </ul>
  );
};

const Home: NextPage = () => {
  const [messages, setMessages] = useState<Array<MessageType>>([]);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [processing, setProcessing] = useState<boolean>(true);

  const welcome = api.chat.welcome.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (welcome.data) {
      setMessages([welcome.data.message as MessageType]);
      setProcessing(false);
    }
  }, [welcome.data]);

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
            Tailwindcss, tRPC, Typescript and the OpenAI chat completion AI.
          </p>
        </div>
        <ProcessingContext.Provider value={processing}>
          <SetProcessingContext.Provider value={setProcessing}>
            <MessagesContext.Provider value={messages}>
              <SetMessagesContext.Provider value={setMessages}>
                <SetTokenCountContext.Provider value={setTokenCount}>
                  <TokenCountContext.Provider value={tokenCount}>
                    <ChatMessages className="mt-5 flex-1 overflow-y-auto" />
                    {tokenCount < 500 && (
                      <PushChatMessageForm className="flex-none" />
                    )}
                  </TokenCountContext.Provider>
                </SetTokenCountContext.Provider>
              </SetMessagesContext.Provider>
            </MessagesContext.Provider>
          </SetProcessingContext.Provider>
        </ProcessingContext.Provider>
      </main>
    </>
  );
};

export default Home;
