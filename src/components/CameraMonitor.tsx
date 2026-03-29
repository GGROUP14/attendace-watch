import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import * as faceapi from 'face-api.js';

interface Alert {
  id: string;
  studentName: string;
  timestamp: string;
  message: string;
}

interface Student {
  id: string;
  name: string;
  image: string;
  isPresent: boolean;
  hasPermission: boolean;
}

interface CameraMonitorProps {
  isActive: boolean;
  onToggleCamera: () => void;
  alerts: Alert[];
  onFaceDetected: (detected: boolean, detectedStudentId?: string) => void;
  students: Student[];
}

export const CameraMonitor = ({ isActive, onToggleCamera, alerts, onFaceDetected, students }: CameraMonitorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const detectionIntervalRef = useRef<number | null>(null);
  const [labeledDescriptors, setLabeledDescriptors] = useState<faceapi.LabeledFaceDescriptors[] | null>(null);
  const faceMatcherRef = useRef<faceapi.FaceMatcher | null>(null);
  const isDetectingRef = useRef(false);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);
        await loadStudentDescriptors();
      } catch (error) {
        console.error('Error loading face detection models:', error);
        setModelsLoaded(true);
      }
    };
    
    loadModels();
  }, [students]);

  // Load student face descriptors for recognition
  const loadStudentDescriptors = async () => {
    try {
      console.log("Loading student face descriptors...");
      const descriptors = await Promise.all(
        students.map(async (student) => {
          try {
            const img = await faceapi.fetchImage(student.image);
            const detection = await faceapi
              .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
              .withFaceLandmarks()
              .withFaceDescriptor();
            
            if (detection) {
              return new faceapi.LabeledFaceDescriptors(student.id, [detection.descriptor]);
            }
            return null;
          } catch (error) {
            console.error(`Failed to load descriptor for ${student.name}:`, error);
            return null;
          }
        })
      );
      
      const validDescriptors = descriptors.filter(d => d !== null) as faceapi.LabeledFaceDescriptors[];
      setLabeledDescriptors(validDescriptors);
      // Pre-build the matcher once
      if (validDescriptors.length > 0) {
        faceMatcherRef.current = new faceapi.FaceMatcher(validDescriptors, 0.55);
      }
      console.log(`Loaded ${validDescriptors.length} student descriptors`);
    } catch (error) {
      console.error("Failed to load student descriptors:", error);
    }
  };

  useEffect(() => {
    if (isActive && modelsLoaded) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, modelsLoaded]);

  // Downscale video frame for faster processing
  const getDownscaledInput = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    
    // Process at 320px width for speed
    const scale = 320 / video.videoWidth;
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const oc = offscreenCanvasRef.current;
    oc.width = w;
    oc.height = h;
    const ctx = oc.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    return { canvas: oc, scale };
  };

  const detectFaces = async () => {
    if (isDetectingRef.current || !videoRef.current || !canvasRef.current) return;
    isDetectingRef.current = true;
    
    try {
      const input = getDownscaledInput();
      if (!input) { isDetectingRef.current = false; return; }
      
      const detections = await faceapi.detectAllFaces(
        input.canvas,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
      ).withFaceLandmarks().withFaceDescriptors();
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const invScale = 1 / input.scale;
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        detections.forEach(detection => {
          const { x, y, width, height } = detection.detection.box;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(x * invScale, y * invScale, width * invScale, height * invScale);
        });
      }

      let detectedStudentId: string | undefined;

      if (detections.length > 0 && faceMatcherRef.current) {
        detections.forEach((detection) => {
          const bestMatch = faceMatcherRef.current!.findBestMatch(detection.descriptor);
          if (bestMatch.label !== 'unknown') {
            detectedStudentId = bestMatch.label;
            console.log(`Recognized: ${bestMatch.label} (dist: ${bestMatch.distance.toFixed(2)})`);
          }
        });
      }
      
      const hasFaces = detections.length > 0;
      setFaceDetected(hasFaces);
      onFaceDetected(hasFaces, detectedStudentId);
      
    } catch (error) {
      console.log('Face detection error:', error);
    } finally {
      isDetectingRef.current = false;
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
          
          // Detect every 500ms with guard against overlap
          detectionIntervalRef.current = window.setInterval(detectFaces, 500);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setFaceDetected(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Camera Monitor</span>
            </div>
            <Button
              variant={isActive ? "destructive" : "default"}
              size="sm"
              onClick={onToggleCamera}
            >
              {isActive ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
            {isActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                <div className="absolute top-2 left-2 flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${faceDetected ? 'bg-destructive animate-pulse' : 'bg-success'}`}></div>
                  <span className="text-xs bg-background/80 px-2 py-1 rounded text-foreground">
                    LIVE - {faceDetected ? 'Face Detected!' : 'Monitoring...'}
                  </span>
                </div>
                {cameraError && (
                  <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                    <div className="text-center text-destructive">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">{cameraError}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <div>
                  <CameraOff className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Camera Offline</p>
                  <p className="text-xs">Click Start to begin monitoring</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-destructive">{alert.studentName}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.timestamp}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
