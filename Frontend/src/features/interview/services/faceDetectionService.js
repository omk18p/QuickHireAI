import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

class FaceDetectionService {
  constructor() {
    this.model = null;
    this.isInitialized = false;
    this.isAvailable = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check if required packages are available
      if (!faceLandmarksDetection || !faceLandmarksDetection.SupportedPackages) {
        console.warn('Face detection packages not available');
        this.isAvailable = false;
        return;
      }

      // Load the model
      this.model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        }
      );
      this.isInitialized = true;
      this.isAvailable = true;
      console.log('Face detection model loaded successfully');
    } catch (error) {
      console.warn('Face detection initialization failed:', error);
      this.isAvailable = false;
    }
  }

  async detectFace(videoElement) {
    if (!this.isAvailable) {
      return {
        faceDetected: true,
        confidenceScore: 1,
        warning: null
      };
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get predictions
      const predictions = await this.model.estimateFaces({
        input: videoElement,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: false
      });

      if (predictions.length === 0) {
        return {
          faceDetected: false,
          confidenceScore: 0,
          warning: 'No face detected'
        };
      }

      // Get the first face detected
      const face = predictions[0];
      
      // Calculate confidence score based on keypoints visibility
      const keypoints = face.keypoints;
      const visibleKeypoints = keypoints.filter(kp => kp.score > 0.5).length;
      const confidenceScore = (visibleKeypoints / keypoints.length) * 100;

      // Determine if face is well-positioned
      const faceBox = face.boundingBox;
      const centerX = faceBox.topLeft[0] + (faceBox.bottomRight[0] - faceBox.topLeft[0]) / 2;
      const centerY = faceBox.topLeft[1] + (faceBox.bottomRight[1] - faceBox.topLeft[1]) / 2;
      
      // Check if face is centered and at a good distance
      const isCentered = Math.abs(centerX - videoElement.videoWidth / 2) < videoElement.videoWidth * 0.2;
      const isGoodSize = faceBox.bottomRight[0] - faceBox.topLeft[0] > videoElement.videoWidth * 0.2;

      let warning = null;
      if (!isCentered) {
        warning = 'Please center your face in the frame';
      } else if (!isGoodSize) {
        warning = 'Please move closer to the camera';
      }

      return {
        faceDetected: true,
        confidenceScore,
        warning,
        faceBox
      };
    } catch (error) {
      console.error('Error detecting face:', error);
      return {
        faceDetected: true,
        confidenceScore: 1,
        warning: 'Error in face detection'
      };
    }
  }
}

export default new FaceDetectionService(); 