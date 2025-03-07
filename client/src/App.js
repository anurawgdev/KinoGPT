import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { FaRobot, FaUser, FaPaperPlane, FaFilm, FaSync } from 'react-icons/fa';
import './App.css';

// Function to get the server URL from the proxy setting or default to port 5000
const getServerUrl = () => {
  // In development, we use the proxy setting from package.json
  if (process.env.NODE_ENV === 'development') {
    return '';  // Empty string means use the proxy setting
  }
  
  // In production, we need to determine the server URL
  return window.location.origin;
};

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [serverUrl] = useState(getServerUrl());
  const messagesEndRef = useRef(null);

  const checkServerStatus = useCallback(async () => {
    try {
      // Try to ping the server
      await axios.get(`${serverUrl}/api/ping`, { timeout: 5000 });
      setServerStatus('online');
    } catch (error) {
      console.error('Server status check failed:', error);
      setServerStatus('offline');
      
      // Only add the system message if we don't already have one
      if (!messages.some(msg => msg.isError && msg.text.includes('server appears to be offline'))) {
        const systemMessage = {
          text: "The server appears to be offline or not responding. Please check your connection and try again.",
          sender: 'bot',
          isError: true
        };
        
        setMessages(prev => [...prev, systemMessage]);
      }
    }
  }, [serverUrl, messages]);

  // Check server status on load
  useEffect(() => {
    checkServerStatus();
    
    // Set up periodic server status checks
    const intervalId = setInterval(checkServerStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [checkServerStatus]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = {
      text: input,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${serverUrl}/api/chat`, { message: input }, { timeout: 60000 });
      
      const botMessage = {
        text: response.data.reply,
        sender: 'bot'
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again later.';
      
      // Check for specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.status === 503) {
          errorMessage = 'The AI model is currently loading. Please try again in a few moments.';
        } else if (error.response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Could not connect to the server. Please check your internet connection and try again.';
        setServerStatus('offline');
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      const botErrorMessage = {
        text: errorMessage,
        sender: 'bot',
        isError: true
      };
      
      setMessages(prev => [...prev, botErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const retryConnection = async () => {
    setServerStatus('checking');
    await checkServerStatus();
  };

  return (
    <AppContainer>
      <Header>
        <Logo>
          <FaFilm />
          <h1>Kino GPT</h1>
        </Logo>
        <Subtitle>Your AI Movie Expert</Subtitle>
        {serverStatus === 'offline' && (
          <ServerStatus>
            <span>Server Offline</span>
            <RetryButton onClick={retryConnection}>
              <FaSync />
            </RetryButton>
          </ServerStatus>
        )}
      </Header>
      
      <ChatContainer>
        <MessageList>
          <WelcomeMessage>
            <BotIcon><FaRobot /></BotIcon>
            <MessageContent>
              <p>Hello! I'm your movie expert chatbot. Ask me anything about the movies in my database!</p>
            </MessageContent>
          </WelcomeMessage>
          
          {messages.map((message, index) => (
            <Message key={index} sender={message.sender}>
              {message.sender === 'bot' ? (
                <BotIcon><FaRobot /></BotIcon>
              ) : (
                <UserIcon><FaUser /></UserIcon>
              )}
              <MessageContent isError={message.isError}>
                <p>{message.text}</p>
              </MessageContent>
            </Message>
          ))}
          
          {isLoading && (
            <Message sender="bot">
              <BotIcon><FaRobot /></BotIcon>
              <MessageContent>
                <TypingIndicator>
                  <span></span>
                  <span></span>
                  <span></span>
                </TypingIndicator>
              </MessageContent>
            </Message>
          )}
          
          <div ref={messagesEndRef} />
        </MessageList>
        
        <InputForm onSubmit={handleSendMessage}>
          <InputField
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about movies..."
            disabled={isLoading || serverStatus === 'offline'}
          />
          <SendButton 
            type="submit" 
            disabled={isLoading || !input.trim() || serverStatus === 'offline'}
          >
            <FaPaperPlane />
          </SendButton>
        </InputForm>
      </ChatContainer>
    </AppContainer>
  );
};

// Styled Components
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 20px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1.5rem;
  color: #e50914;
`;

const Subtitle = styled.p`
  color: #aaa;
  font-size: 1rem;
`;

const ServerStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
  color: #ff6b6b;
  font-size: 0.9rem;
`;

const RetryButton = styled.button`
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.2s;
  
  &:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: #1e1e1e;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Message = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 80%;
  align-self: ${props => props.sender === 'user' ? 'flex-end' : 'flex-start'};
  flex-direction: ${props => props.sender === 'user' ? 'row-reverse' : 'row'};
`;

const WelcomeMessage = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 80%;
  margin-bottom: 20px;
`;

const MessageContent = styled.div`
  background-color: ${props => {
    if (props.isError) return '#ff6b6b';
    return props.sender === 'user' ? '#e50914' : '#2a2a2a';
  }};
  padding: 12px 16px;
  border-radius: 18px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  
  p {
    margin: 0;
    line-height: 1.5;
  }
`;

const BotIcon = styled.div`
  background-color: #e50914;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const UserIcon = styled.div`
  background-color: #0070f3;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const InputForm = styled.form`
  display: flex;
  padding: 15px;
  background-color: #2a2a2a;
  border-top: 1px solid #333;
`;

const InputField = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 25px;
  background-color: #3a3a3a;
  color: white;
  font-size: 1rem;
  outline: none;
  
  &:focus {
    box-shadow: 0 0 0 2px #e50914;
  }
  
  &::placeholder {
    color: #aaa;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  background-color: #e50914;
  color: white;
  border: none;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f40612;
  }
  
  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  
  span {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: #aaa;
    border-radius: 50%;
    animation: bounce 1.5s infinite ease-in-out;
    
    &:nth-child(1) {
      animation-delay: 0s;
    }
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
  
  @keyframes bounce {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-5px);
    }
  }
`;

export default App; 