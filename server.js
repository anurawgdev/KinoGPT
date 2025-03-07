const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
// Try to use PORT from env, or try a range of ports if the default is in use
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Load movie data
const moviesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/movies.json'), 'utf8'));

// Create a context string from movie data for AI prompting
const createMovieContext = () => {
  let context = "Movie Database Information:\n\n";
  
  moviesData.forEach(movie => {
    context += `Title: ${movie.title}\n`;
    context += `Year: ${movie.year}\n`;
    context += `Director: ${movie.director}\n`;
    context += `Genre: ${movie.genre.join(', ')}\n`;
    context += `Plot: ${movie.plot}\n`;
    context += `Actors: ${movie.actors.join(', ')}\n`;
    context += `Rating: ${movie.rating}\n\n`;
  });
  
  return context;
};

// Simple ping endpoint to check if server is running
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API endpoint for chat using Hugging Face Inference API
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const movieContext = createMovieContext();
    
    // Prepare prompt for the model
    const prompt = `You are a helpful movie expert assistant. Answer questions based strictly on the following movie database. 
                   If the question is not related to movies in the database, politely inform the user that you can only 
                   answer questions about movies in your database. 
                   
                   Do not fabricate or make up information about movies that aren't in the database. 

                      Format your responses with:
                    - Proper spacing between paragraphs (use double line breaks)
                    - Well-organized bullet points or numbered lists when appropriate
                    - Consistent heading styles when needed
                    - Clear visual separation between different parts of your answer
                   
                   Here's the movie database information:
                   
                   ${movieContext}
                   
                   User question: ${message}
                   
                   Assistant:`;
    
    // Call Hugging Face Inference API
    // Using a smaller, more reliable model
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/flan-t5-base',
      { inputs: prompt },
      {
        headers: {
          'Content-Type': 'application/json',
          // No auth token required for public models with low usage
        },
        timeout: 60000 // 60 second timeout
      }
    );
    
    let reply = response.data[0]?.generated_text || '';
    
    // Extract only the assistant's response (remove the prompt)
    if (reply.includes('Assistant:')) {
      reply = reply.split('Assistant:')[1].trim();
    } else {
      // If the model doesn't follow the format, just return everything after the user question
      const userQuestionIndex = reply.indexOf(`User question: ${message}`);
      if (userQuestionIndex !== -1) {
        reply = reply.substring(userQuestionIndex + `User question: ${message}`.length).trim();
      }
    }
    
    res.json({ reply });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    
    // Check if it's a model loading error from Hugging Face
    if (error.response?.data?.error?.includes('Model is currently loading')) {
      return res.status(503).json({ 
        error: 'The AI model is currently loading. Please try again in a few moments.',
        details: error.response.data.error
      });
    }
    
    res.status(500).json({ 
      error: 'Something went wrong with the AI service. Please try again later.',
      details: error.response?.data || error.message
    });
  }
});

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Try to start the server on the specified port, or try alternative ports if busy
const startServer = (port) => {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      // Update the proxy in package.json if needed
      updateClientProxy(port);
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Error starting server:', error);
    }
  }
};

// Function to update the client's proxy setting if we use a different port
const updateClientProxy = (port) => {
  if (port === 5000) return; // No need to update if using default port
  
  try {
    const clientPackagePath = path.join(__dirname, 'client/package.json');
    const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
    clientPackage.proxy = `http://localhost:${port}`;
    fs.writeFileSync(clientPackagePath, JSON.stringify(clientPackage, null, 2));
    console.log(`Updated client proxy to use port ${port}`);
  } catch (error) {
    console.error('Error updating client proxy:', error);
  }
};

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy, trying port 5001...`);
    server.close();
    // Try an alternative port
    app.listen(5001, () => {
      console.log(`Server running on port 5001`);
      // Update the client's proxy setting
      try {
        const clientPackagePath = path.join(__dirname, 'client/package.json');
        const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
        clientPackage.proxy = 'http://localhost:5001';
        fs.writeFileSync(clientPackagePath, JSON.stringify(clientPackage, null, 2));
        console.log('Updated client proxy to use port 5001');
      } catch (err) {
        console.error('Error updating client proxy:', err);
      }
    });
  } else {
    console.error('Error starting server:', error);
  }
}); 