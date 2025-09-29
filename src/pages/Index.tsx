import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { StudentCard } from "@/components/StudentCard";
import { ClassSchedule } from "@/components/ClassSchedule";
import { CameraMonitor } from "@/components/CameraMonitor";
import { AttendanceStats } from "@/components/AttendanceStats";
import { AddStudentForm } from "@/components/AddStudentForm";
import { GraduationCap, Save, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";


interface Student {
  id: string;
  name: string;
  image: string | null;
  isPresent: boolean;
  hasPermission: boolean;
}

interface Alert {
  id: string;
  studentName: string;
  timestamp: string;
  message: string;
}

const Index = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);

  // Fetch students from database
  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
        return;
      }

      const formattedStudents: Student[] = data.map(student => ({
        id: student.id,
        name: student.name,
        image: student.photo_url || "/placeholder.svg",
        isPresent: student.is_present,
        hasPermission: student.has_permission
      }));

      setStudents(formattedStudents);
      console.log('Students loaded:', formattedStudents.length, 'with photos:', formattedStudents.filter(s => s.image && s.image !== "/placeholder.svg").length);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Load students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const [cameraActive, setCameraActive] = useState(false);
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertedStudentsThisHour, setAlertedStudentsThisHour] = useState<Set<string>>(new Set());

  // Update current time every second and reset hourly alerts tracker
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date();
      const currentHour = newTime.getHours();
      const prevHour = currentTime.getHours();
      
      setCurrentTime(newTime);
      
      // Reset alerted students tracker when hour changes
      if (currentHour !== prevHour) {
        setAlertedStudentsThisHour(new Set());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentTime]);

  // Check for class reminders - track last alerted minute to avoid spam
  const [lastAlertedMinute, setLastAlertedMinute] = useState<string>("");
  
  useEffect(() => {
    const checkClassReminder = () => {
      const schedule = [
        "09:00", "10:00", "11:00", "12:00", "13:30", "14:30", "15:45"
      ];
      
      const currentTimeStr = currentTime.toTimeString().slice(0, 5);
      
      // Only trigger if we haven't already alerted for this minute
      if (schedule.includes(currentTimeStr) && currentTimeStr !== lastAlertedMinute) {
        setLastAlertedMinute(currentTimeStr);
        toast({
          title: "⏰ Class Starting",
          description: "A new class has started! Please mark attendance.",
          duration: 5000,
        });
      }
    };

    checkClassReminder();
  }, [currentTime, toast, lastAlertedMinute]);

  const [faceDetectionActive, setFaceDetectionActive] = useState(false);

  // Handle face detection from camera
  const handleFaceDetected = (detected: boolean, detectedStudentId?: string) => {
    console.log('Face detection triggered:', { detected, detectedStudentId, cameraActive, attendanceSubmitted });
    setFaceDetectionActive(detected);
    
    if (!detected || !cameraActive || !attendanceSubmitted) {
      console.log('Early return from face detection:', { detected, cameraActive, attendanceSubmitted });
      return;
    }
    
    // If a specific student was recognized, check only that student
    if (detectedStudentId) {
      const detectedStudent = students.find(s => s.id === detectedStudentId);
      
      if (detectedStudent && !detectedStudent.isPresent && !detectedStudent.hasPermission) {
        // Check if this student was already alerted in this hour
        if (alertedStudentsThisHour.has(detectedStudent.id)) {
          console.log(`Student ${detectedStudent.name} already alerted this hour - skipping alert`);
          return;
        }
        
        console.log(`Recognized student ${detectedStudent.name} - alerting (no attendance and no permission)`);
        
        // Add student to alerted list for this hour BEFORE creating alert
        setAlertedStudentsThisHour(prev => new Set([...prev, detectedStudent.id]));
        
        // Create alert
        const newAlert: Alert = {
          id: `${Date.now()}-${detectedStudent.id}`,
          studentName: detectedStudent.name,
          timestamp: new Date().toLocaleTimeString(),
          message: "Recognized student absent without permission during class"
        };
        
        setAlerts(prev => [newAlert, ...prev.slice(0, 7)]);
        
        // Show toast notification
        toast({
          title: "🚨 Student Alert",
          description: `${detectedStudent.name} detected outside without permission!`,
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  };

  const handleAttendanceChange = async (id: string, isPresent: boolean) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ is_present: isPresent })
        .eq('id', id);

      if (error) {
        console.error('Error updating attendance:', error);
        sonnerToast.error("Failed to update attendance");
        return;
      }

      setStudents(prev => 
        prev.map(student => 
          student.id === id ? { ...student, isPresent } : student
        )
      );
    } catch (error) {
      console.error('Error updating attendance:', error);
      sonnerToast.error("Failed to update attendance");
    }
  };

  const handlePermissionChange = async (id: string, hasPermission: boolean) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ has_permission: hasPermission })
        .eq('id', id);

      if (error) {
        console.error('Error updating permission:', error);
        sonnerToast.error("Failed to update permission");
        return;
      }

      setStudents(prev => 
        prev.map(student => 
          student.id === id ? { ...student, hasPermission } : student
        )
      );
    } catch (error) {
      console.error('Error updating permission:', error);
      sonnerToast.error("Failed to update permission");
    }
  };

  const handleSubmitAttendance = () => {
    setAttendanceSubmitted(true);
    setCameraActive(true);
    
    // Clear any existing alerts and reset hourly tracker
    setAlerts([]);
    setAlertedStudentsThisHour(new Set());
    
    console.log("Attendance submitted - monitoring will start in 1 second intervals");
    
    toast({
      title: "✅ Attendance Submitted",
      description: "Real-time camera monitoring has started. Face recognition active.",
      duration: 3000,
    });
  };

  const toggleCamera = () => {
    if (!attendanceSubmitted) {
      toast({
        title: "⚠️ Submit Attendance First",
        description: "Please submit attendance before starting camera monitoring.",
        variant: "destructive",
      });
      return;
    }
    setCameraActive(!cameraActive);
  };

  const stats = {
    totalStudents: students.length,
    presentStudents: students.filter(s => s.isPresent).length,
    absentStudents: students.filter(s => !s.isPresent).length,
    permittedStudents: students.filter(s => s.hasPermission).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Classroom Attendance System</h1>
                <p className="text-sm text-muted-foreground">
                  {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleSubmitAttendance}
              disabled={attendanceSubmitted}
              className="bg-success hover:bg-success/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {attendanceSubmitted ? "Attendance Submitted" : "Submit Attendance"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Stats */}
          <AttendanceStats {...stats} />

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Student List */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Student Roster</span>
                    {!attendanceSubmitted && (
                      <div className="flex items-center space-x-2 text-warning">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Mark attendance</span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {students.map((student) => (
                    <StudentCard
                      key={student.id}
                      {...student}
                      onAttendanceChange={handleAttendanceChange}
                      onPermissionChange={handlePermissionChange}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <AddStudentForm onStudentAdded={fetchStudents} />
              <ClassSchedule />
              <CameraMonitor
                isActive={cameraActive}
                onToggleCamera={toggleCamera}
                alerts={alerts}
                onFaceDetected={handleFaceDetected}
                students={students}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
