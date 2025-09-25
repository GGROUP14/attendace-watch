import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Alert {
  id: string;
  studentName: string;
  timestamp: string;
  message: string;
}

interface CameraMonitorProps {
  isActive: boolean;
  onToggleCamera: () => void;
  alerts: Alert[];
}

export const CameraMonitor = ({ isActive, onToggleCamera, alerts }: CameraMonitorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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
                <div className="absolute top-2 left-2 flex items-center space-x-2">
                  <div className="animate-pulse bg-success w-3 h-3 rounded-full"></div>
                  <span className="text-xs bg-background/80 px-2 py-1 rounded text-foreground">
                    LIVE - Face Recognition Active
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
                  <p className="text-xs">Submit attendance to start monitoring</p>
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