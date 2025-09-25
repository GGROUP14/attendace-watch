import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, AlertTriangle } from "lucide-react";
import { useState } from "react";

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
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            {isActive ? (
              <div className="text-center">
                <div className="animate-pulse bg-success w-3 h-3 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Camera Active - Monitoring Outside</p>
                <p className="text-xs text-muted-foreground mt-1">Face recognition enabled</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <CameraOff className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Camera Offline</p>
                <p className="text-xs">Submit attendance to start monitoring</p>
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