# Movie Chatbot

A generative AI chatbot that specializes in questions related to movies.

## Features

- Chat interface to ask questions about movies
- AI-powered responses based on a movie database using open-source models
- Modern, responsive UI with a Netflix-inspired design
- Multiple AI options: Hugging Face API (cloud) or Ollama (local)
- Automatic port selection if default port is busy
- Improved error handling and server status monitoring

## Tech Stack

- **Frontend**: React, Styled Components
- **Backend**: Node.js, Express
- **AI Options**: 
  - Hugging Face Inference API (free, open-source models)
  - Ollama (run open-source models locally)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- (Optional) Ollama for local model support: [Install Ollama](https://ollama.ai/)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd movie-chatbot
   ```

2. Install server dependencies:
   ```
   npm install
   ```

3. Install client dependencies:
   ```
   cd client
   npm install
   cd ..
   ```

### Running the Application

#### Quick Start (Recommended)

Use the launcher script to choose your AI backend:

```
npm run launcher
```

This will prompt you to choose between Hugging Face API (cloud) or Ollama (local).

#### Option 1: Using Hugging Face API (Cloud)

1. Start the development server:
   ```
   npm run dev
   ```

2. In a separate terminal, start the React client:
   ```
   npm run client
   ```

3. Or run both concurrently:
   ```
   npm run dev-all
   ```

#### Option 2: Using Ollama (Local LLM)

1. Install Ollama from [ollama.ai](https://ollama.ai/)

2. Pull a model (one-time setup):
   ```
   ollama pull llama3.2
   ```

3. Start the Ollama service

4. Start the local development server:
   ```
   npm run dev-local
   ```

5. In a separate terminal, start the React client:
   ```
   npm run client
   ```

6. Or run both concurrently:
   ```
   npm run dev-all-local
   ```

7. Open your browser and navigate to `http://localhost:3000`

## Troubleshooting

### Port Already in Use

If you see an error like `Error: listen EADDRINUSE: address already in use :::5000`, the application will automatically try to use port 5001 instead. You don't need to do anything - the server will handle this automatically.

### Server Connection Issues

If you see "Server Offline" in the UI:
1. Check that your server is running in the terminal
2. Click the refresh icon next to "Server Offline" to retry the connection
3. If using Ollama, make sure the Ollama service is running

### Hugging Face API Issues

If you're getting errors with the Hugging Face API:
1. The model might be loading - wait a few moments and try again
2. There might be rate limiting - the free tier has usage limits
3. Try switching to the local Ollama option if problems persist

## How It Works

The application uses a JSON database of movies and leverages either the Hugging Face Inference API or a local LLM via Ollama to generate responses to user queries about these movies. The backend formats the movie data into a context string that is sent along with the user's query to the language model, which then generates a relevant response.

## Project Structure

- `/client` - React frontend
- `/data` - JSON movie database
- `server.js` - Express backend server (Hugging Face API version)
- `server-local.js` - Express backend server (Ollama local version)
- `start.js` - Launcher script to choose AI backend
- `.env` - Environment variables (not tracked in git)

## Adding More Models

### Hugging Face Models
The application currently uses the `google/flan-t5-base` model from Hugging Face. You can experiment with other open-source models by changing the model endpoint in the server.js file. Some other options include:
- `facebook/bart-large-cnn`
- `EleutherAI/gpt-neo-125M`
- `distilbert-base-uncased-finetuned-sst-2-english`

### Local Models with Ollama
For the local version, you can use any model supported by Ollama. To see available models:
```
ollama list
```

To pull a new model:
```
ollama pull mistral
```

Then update the model name in `server-local.js`.

## Adding More Movies

To expand the movie database, add more movie objects to the `data/movies.json` file following the existing format.

## License

MIT 
