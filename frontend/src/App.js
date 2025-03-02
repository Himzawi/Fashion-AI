import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Define the backend base URL
const BACKEND_URL = 'https://fashion-muzm.onrender.com';

const App = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [remixingSuggestions, setRemixingSuggestions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Add error state
  const [error, setError] = useState('');

  // Check if the backend is up using the root endpoint
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await axios.get(BACKEND_URL);
        console.log('Backend status:', response.data);
      } catch (error) {
        console.log('Backend check failed, but this is not critical:', error);
      }
    };
    
    checkBackendStatus();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      alert('Please upload a file first!');
      return;
    }
    
    // Reset states
    setIsLoading(true);
    setError('');
    setFeedback('');
    setRecommendations('');
    setRemixingSuggestions('');
    
    try {
      // Get user location with error handling
      let locationData = { latitude: null, longitude: null };
      try {
        locationData = await getUserLocation();
      } catch (locationError) {
        console.warn('Location error, continuing without location:', locationError);
      }

      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Add latitude and longitude to the form data if available
      if (locationData.latitude !== null) {
        formData.append('latitude', locationData.latitude);
        formData.append('longitude', locationData.longitude);
      }

      // Setup request with timeout and proper error handling
      const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout
      });

      // Set feedback and recommendations
      setFeedback(response.data.feedback || "No feedback received");
      
      // Combine regular recommendations with weather recommendations
      const allRecommendations = response.data.weather_recommendations 
        ? `${response.data.recommendations || ""}\n\n${response.data.weather_recommendations}`
        : (response.data.recommendations || "No recommendations received");
        
      setRecommendations(allRecommendations);
      setRemixingSuggestions(response.data.remixing_suggestions || "No remixing suggestions received");
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to process your request');
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        setError(`Error: ${error.response.status} - ${error.response.data.error || 'Something went wrong'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        setError('Error: No response received from the server. It might be down or overloaded. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        setError(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            // Resolve with null values if geolocation fails
            resolve({
              latitude: null,
              longitude: null,
            });
          },
          { timeout: 10000 } // 10 second timeout for location
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
        // Resolve with null values if geolocation is not supported
        resolve({
          latitude: null,
          longitude: null,
        });
      }
    });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>AI Fashion Advisor</h1>
        <p>Upload your outfit and get personalized feedback!</p>
      </header>

      <main className="main">
        <div className="upload-section" data-aos="fade-up">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="file-input"
            accept="image/*" // Only accept image files
          />
          <button
            onClick={handleUpload}
            className="upload-button"
            disabled={isLoading || !file}
          >
            {isLoading ? 'Processing...' : 'Get Feedback'}
          </button>
        </div>

        {isLoading && (
          <div className="loading-screen" data-aos="fade-in">
            <div className="loader"></div>
            <p>Analyzing your outfit...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="error-section" data-aos="fade-in">
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        )}

        {feedback && !isLoading && (
          <div className="feedback-section" data-aos="fade-left">
            <h2>Feedback</h2>
            <p>{feedback}</p>
          </div>
        )}

        {recommendations && !isLoading && (
          <div className="suggestions-section" data-aos="fade-right">
            <h2>You might also like</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{recommendations}</p>
          </div>
        )}

        {remixingSuggestions && !isLoading && (
          <div className="remixing-suggestions-section" data-aos="fade-up">
            <h2>Outfit Remixing</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{remixingSuggestions}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;