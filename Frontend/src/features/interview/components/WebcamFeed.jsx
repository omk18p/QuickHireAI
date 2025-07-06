import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import '../styles/WebcamFeed.css';

const WebcamFeed = ({ onConfidenceScore }) => {
  const webcamRef = useRef(null);
  const [confidence, setConfidence] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    let camera = null;
    let faceMesh = null;

    const setupFaceMesh = async () => {
      faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          setFaceDetected(true);
          const landmarks = results.multiFaceLandmarks[0];
          // Use nose tip (landmark 1) for center calculation
          const nose = landmarks[1];
          const video = webcamRef.current.video;
          const frameCenter = { x: video.videoWidth / 2, y: video.videoHeight / 2 };
          const dx = (nose.x * video.videoWidth) - frameCenter.x;
          const dy = (nose.y * video.videoHeight) - frameCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.sqrt(Math.pow(frameCenter.x, 2) + Math.pow(frameCenter.y, 2));
          const centerScore = 1 - Math.min(dist / maxDist, 1);
          const score = Math.round(centerScore * 100);
          setConfidence(score);
          if (onConfidenceScore) onConfidenceScore(score);
        } else {
          setFaceDetected(false);
          setConfidence(0);
          if (onConfidenceScore) onConfidenceScore(0);
        }
      });

      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          await faceMesh.send({ image: webcamRef.current.video });
        },
        width: 400,
        height: 300,
      });
      camera.start();
    };

    if (webcamRef.current && webcamRef.current.video) {
      setupFaceMesh();
    }

    return () => {
      if (camera) camera.stop();
    };
  }, [onConfidenceScore]);

  return (
    <div className="webcam-container">
      <div className="video-wrapper">
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{ width: 400, height: 300, facingMode: "user" }}
          className="webcam-feed"
          style={{
            objectFit: 'cover',
            width: 400,
            height: 300,
            borderRadius: 10,
            transform: 'scaleX(-1)' // MIRROR VIEW
          }}
        />
        <div className="face-detection-overlay" style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.85)',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          padding: '0.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
          border: faceDetected ? '2px solid #22c55e' : '2px solid #ef4444'
        }}>
          <div className="confidence-score" style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#222',
            marginTop: '0.2rem',
            background: '#f3f4f6',
            borderRadius: 6,
            padding: '0.2rem 0.7rem',
            display: 'inline-block'
          }}>
            Confidence: {confidence}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamFeed; 