// Debug script to test voice processing
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Test environment variables
console.log('=== Environment Variables Check ===');
console.log('GOOGLE__GENERATIVE_AI_API_KEY:', process.env.GOOGLE__GENERATIVE_AI_API_KEY ? 'SET' : 'NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');

// Test API endpoint
async function testVoiceAPI() {
    try {
        // Create a mock audio file (small base64 encoded silence)
        const mockAudioBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        const audioBuffer = Buffer.from(mockAudioBase64, 'base64');
        
        const formData = new FormData();
        formData.append('audio', new Blob([audioBuffer], { type: 'audio/webm' }), 'test.webm');
        formData.append('duration', '2');

        console.log('\n=== Testing POST /api/process-voice ===');
        console.log('Sending mock audio data...');

        const response = await fetch('http://localhost:3000/api/process-voice', {
            method: 'POST',
            body: formData,
            headers: {
                'Cookie': 'your-auth-cookie-here' // You'll need to be logged in
            }
        });

        const result = await response.text();
        console.log('Response status:', response.status);
        console.log('Response body:', result);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Test Gemini API directly
async function testGeminiAPI() {
    try {
        console.log('\n=== Testing Gemini API Directly ===');
        
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE__GENERATIVE_AI_API_KEY);
        
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('Testing with model:', model.model);
        
        const result = await model.generateContent('Hello, can you transcribe this?');
        console.log('Gemini API test successful:', result.response.text());
        
    } catch (error) {
        console.error('Gemini API test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run tests
async function runTests() {
    await testGeminiAPI();
    // await testVoiceAPI(); // Uncomment when running with auth
}

runTests();
