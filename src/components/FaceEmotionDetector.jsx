// src/components/FaceEmotionDetector.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceEmotionDetector = ({ onExpressionChange }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      startVideo();
    };

    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error('Camera error:', err));
    };

    loadModels();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (
        videoRef.current &&
        faceapi.nets.tinyFaceDetector.params &&
        faceapi.nets.faceExpressionNet.params
      ) {
        const result = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceExpressions();

        if (result?.expressions) {
          const sorted = Object.entries(result.expressions).sort(
            (a, b) => b[1] - a[1]
          );
          const topExpression = sorted[0][0];
          onExpressionChange(topExpression);
        } else {
          onExpressionChange('No face detected');
        }
      }
    }, 800);

    return () => clearInterval(interval);
  }, [onExpressionChange]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      width="400"
      height="300"
      className="rounded-xl shadow mb-6"
    />
  );
};

export default FaceEmotionDetector;
