// Simple test to debug voice recording issue
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('=== Voice Recording Debug Test ===');
console.log('Environment loaded:', process.env.GOOGLE__GENERATIVE_AI_API_KEY ? 'YES' : 'NO');

// Test 1: Check if the issue is in VoiceRecorder logic
console.log('\n1. Testing VoiceRecorder logic...');

// Simulate the exact logic from VoiceRecorder.tsx
const MIN_RECORDING_SECONDS = 1;

function simulateVoiceRecording(transcript, duration) {
    console.log(`Simulating recording: transcript="${transcript}", duration=${duration}s`);
    
    // This is the exact logic from VoiceRecorder.tsx line 466-471
    let localExtracted = { tasks: [], summary: 'No speech detected' };
    
    if (duration < MIN_RECORDING_SECONDS && !transcript.trim()) {
        console.log('❌ Recording too short - returning "No speech detected"');
        return localExtracted;
    }
    
    // If we have transcript, try local extraction
    if (transcript) {
        console.log('✅ Has transcript, trying local extraction...');
        localExtracted = {
            tasks: [{ title: 'Test task', description: transcript, type: 'task' }],
            summary: `Extracted from: ${transcript}`
        };
    }
    
    console.log('Result:', localExtracted);
    return localExtracted;
}

// Test different scenarios
console.log('\n2. Testing different scenarios:');

// Test case 1: Empty transcript, short duration
console.log('Test 1: Empty transcript, short duration');
simulateVoiceRecording('', 0.5);

// Test case 2: Has transcript, short duration  
console.log('\nTest 2: Has transcript, short duration');
simulateVoiceRecording('I need to call mom', 0.5);

// Test case 3: Has transcript, sufficient duration
console.log('\nTest 3: Has transcript, sufficient duration');
simulateVoiceRecording('I need to call mom tomorrow', 2);

// Test case 4: Empty transcript, sufficient duration
console.log('\nTest 4: Empty transcript, sufficient duration');
simulateVoiceRecording('', 2);

console.log('\n=== Analysis ===');
console.log('The issue likely occurs when:');
console.log('- Transcript is empty AND duration < 1 second');
console.log('- OR when local extraction fails to find patterns');
console.log('\nNext steps:');
console.log('1. Check if SpeechRecognition is actually capturing audio');
console.log('2. Check if local extraction patterns are too restrictive');
console.log('3. Add better logging to see what transcript actually contains');
