"use client";
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js'; // Import face-api.js for emotion detection
import { Button } from '@/components/ui/button';
import useSpeechToText from 'react-hook-speech-to-text';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';
import { chatSession } from '@/utils/GeminiAIModal';
import { UserAnswer } from '@/utils/schema';
import moment from 'moment';
import { db } from '@/utils/db';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

function RecordAnswerSection({ mockInterviewQuestions, activeQuestionIndex, interviewData }) {
  if (!mockInterviewQuestions || !mockInterviewQuestions.length) {
    console.error("mockInterviewQuestions is not defined or empty");
    return null;
  }

  const { user } = useUser();
  const [userAnswer, setUserAnswer] = useState(''); // State to store user answer
  const [loading, setLoading] = useState(false);
  const [emotionsList, setEmotionsList] = useState([]); // Array to store multiple emotions
  const {
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  // Update userAnswer based on speech recognition results
  useEffect(() => {
    if (results && results.length > 0) {
      setUserAnswer(prevAns => prevAns + results[results.length - 1]?.transcript + ' ');
    }
  }, [results]);

  const webcamRef = useRef(null);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState(false);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // Path to models folder
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    };
    loadModels();
  }, []);

  // Function to detect emotion in real-time from webcam feed and store multiple emotions
  const detectEmotion = async () => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();

      if (detections && detections.expressions) {
        const maxEmotion = Object.entries(detections.expressions).reduce((prev, curr) => (curr[1] > prev[1] ? curr : prev));
        setEmotionsList((prevList) => [...prevList, { emotion: maxEmotion[0], timestamp: new Date().toISOString() }]); // Add to array with timestamp
      }
    }
  };

  // Start detecting emotions continuously while webcam is enabled
  useEffect(() => {
    const interval = setInterval(() => {
      detectEmotion();
    }, 10000); // Detect emotions every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  useEffect(() => {
    const checkWebcamAvailability = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setIsWebcamAvailable(true);
      } catch (error) {
        console.error("Webcam not available:", error);
        setIsWebcamAvailable(false);
      }
    };
    checkWebcamAvailability();
  }, []);

  // Update DB when recording stops and answer is long enough
  useEffect(() => {
    if (!isRecording && userAnswer.length > 10) {
      UpdateUserAnswerInDb();
    }
  }, [isRecording, userAnswer]);

  const StartStopRecording = () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      setUserAnswer('');
      setEmotionsList([]); // Clear emotions list on new recording
      startSpeechToText();
    }
  };

  // Function to update user answer in the DB with multiple emotions
  const UpdateUserAnswerInDb = async () => {
    if (userAnswer?.length < 10) {
      toast("Error: Answer too short, please record again.");
      return;
    }

    const feedbackPrompt = `
      Question: ${mockInterviewQuestions[activeQuestionIndex]?.question}, 
      User Answer: ${userAnswer}.
      Please provide feedback and a rating from scale 1 to 5for this answer in JSON format with fields 'rating' and 'feedback'.
    `;

    try {
      const result = await chatSession.sendMessage(feedbackPrompt);
      const feedbackData = result.response.candidates[0]?.content?.parts[0]?.text;

      const jsonMatch = feedbackData?.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        const { rating, feedback } = JSON.parse(jsonMatch[1].trim());

        const resp = await db.insert(UserAnswer).values({
          mockIdRef: interviewData?.mockId,
          question: mockInterviewQuestions[activeQuestionIndex]?.question,
          correctAnswer: mockInterviewQuestions[activeQuestionIndex]?.answer,
          userAnswer,
          feedback,
          rating,
          userEmail: user?.primaryEmailAddress?.emailAddress,
          createdAt: moment().format('DD-MM-YYYY'),
          emotion: JSON.stringify(emotionsList), // Save the entire emotions array as JSON
        });

        if (resp) {
          toast('User Answer recorded successfully');
          setUserAnswer('');
          setResults([]);
          setEmotionsList([]); // Clear the emotion list after saving
        } else {
          console.error("Failed to save data to the database.");
        }
      } else {
        console.error("JSON format not found in feedback.");
      }
    } catch (error) {
      console.error("Error in UpdateUserAnswerInDb:", error);
      toast("Error: Failed to save your answer.");
    }
  };

  return (
    <div className='flex items-center justify-center flex-col'>
      <div className='flex flex-col my-20 justify-center items-center rounded-lg p-5 bg-black'>
        {isWebcamAvailable ? (
          <Webcam
            audio={true}
            ref={webcamRef}
            className="w-full h-auto border rounded-lg"
            mirrored={true}
            style={{
              height: 300,
              width: '100%',
              zIndex: 10,
            }}
          />
        ) : (
          <Image
            src={'/webcam.png'} // Path to webcam icon
            width={200}
            height={200}
            className="mb-4"
            alt="Webcam Icon"
          />
        )}
      </div>

      <Button
        disabled={loading}
        variant="outline"
        className="my-10"
        onClick={StartStopRecording}
      >
        {isRecording ? (
          <span className="flex items-center">
            <Mic className="mr-2" />
            <span className='text-red-600'>Stop Recording</span>
          </span>
        ) : (
          'Record Answer'
        )}
      </Button>
    </div>
  );
}

export default RecordAnswerSection;
