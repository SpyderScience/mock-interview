"use client"; // Add this to mark the component as a Client Component

import React from 'react';
import { useParams } from 'next/navigation'; // Correct import from next/navigation

function InterviewPage({params}) {
  const { interviewId } = useParams(); // Get dynamic interviewId from the URL

  return (
    <div>
      <h1>Interview ID: {interviewId}</h1>
    </div>
  );
}

export default InterviewPage;
