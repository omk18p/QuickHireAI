class FaceAnalysisService {
  constructor() {
    // Initialize any necessary state
  }

  // Calculate confidence score based on face position and size
  calculateConfidenceScore(faceData, frameSize) {
    if (!faceData) return 0;

    // Get face box coordinates
    const { topLeft, bottomRight } = faceData.faceBox;
    const faceWidth = bottomRight[0] - topLeft[0];
    const faceHeight = bottomRight[1] - topLeft[1];

    // Calculate face position score (how centered the face is)
    const frameCenterX = frameSize.width / 2;
    const frameCenterY = frameSize.height / 2;
    const faceCenterX = topLeft[0] + faceWidth / 2;
    const faceCenterY = topLeft[1] + faceHeight / 2;
    
    const positionScoreX = 1 - Math.abs(faceCenterX - frameCenterX) / (frameSize.width / 2);
    const positionScoreY = 1 - Math.abs(faceCenterY - frameCenterY) / (frameSize.height / 2);
    const positionScore = (positionScoreX + positionScoreY) / 2;

    // Calculate face size score (how close the face is)
    const idealFaceWidth = frameSize.width * 0.3; // Ideal face width is 30% of frame width
    const sizeScore = 1 - Math.abs(faceWidth - idealFaceWidth) / idealFaceWidth;

    // Calculate final confidence score
    const confidenceScore = (positionScore * 0.6 + sizeScore * 0.4) * 100;
    return Math.min(Math.max(confidenceScore, 0), 100);
  }

  async analyzeFrame(frameData) {
    try {
      const { faceBox, frameSize } = frameData;

      if (!faceBox) {
        return {
          faceDetected: false,
          confidenceScore: 0,
          warning: 'No face detected in frame'
        };
      }

      const confidenceScore = this.calculateConfidenceScore({ faceBox }, frameSize);

      // Generate warning if confidence is low
      let warning = null;
      if (confidenceScore < 50) {
        warning = 'Please position your face better in the frame.';
      } else if (confidenceScore < 70) {
        warning = 'Try to center your face in the frame.';
      }

      return {
        faceDetected: true,
        confidenceScore: Math.round(confidenceScore),
        warning
      };
    } catch (error) {
      console.error('Error analyzing frame:', error);
      return {
        faceDetected: false,
        confidenceScore: 0,
        warning: 'Error processing face detection.'
      };
    }
  }
}

module.exports = new FaceAnalysisService(); 