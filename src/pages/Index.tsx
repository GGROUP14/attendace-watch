import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { StudentCard } from "@/components/StudentCard";
import { ClassSchedule } from "@/components/ClassSchedule";
import { CameraMonitor } from "@/components/CameraMonitor";
import { AttendanceStats } from "@/components/AttendanceStats";
import { GraduationCap, Save, AlertCircle } from "lucide-react";

// Import student images
import studentBresto from "@/assets/student-bresto.jpg";
import studentBestwin from "@/assets/student-bestwin.jpg";
import studentChristo from "@/assets/student-christo.jpg";
import studentChristopher from "@/assets/student-christopher.jpg";

interface Student {
  id: string;
  name: string;
  image: string;
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
  const [students, setStudents] = useState<Student[]>([
    {
      id: "1",
      name: "Bresto K Benny",
      image: studentBresto,
      isPresent: false,
      hasPermission: false,
    },
    {
      id: "2", 
      name: "Bestwin Paul",
      image: studentBestwin,
      isPresent: false,
      hasPermission: false,
    },
    {
      id: "3",
      name: "Christo Sojan", 
      image: studentChristo,
      isPresent: false,
      hasPermission: false,
    },
    {
      id: "4",
      name: "Christopher Biju",
      image: studentChristopher,
      isPresent: false,
      hasPermission: false,
    },
  ]);

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

  // Check for class reminders
  useEffect(() => {
    const checkClassReminder = () => {
      const schedule = [
        "09:00", "10:00", "11:00", "12:00", "13:30", "14:30", "15:45"
      ];
      
      const currentTimeStr = currentTime.toTimeString().slice(0, 5);
      
      if (schedule.includes(currentTimeStr)) {
        toast({
          title: "⏰ Class Starting",
          description: "A new class has started! Please mark attendance.",
          duration: 5000,
        });
      }
    };

    checkClassReminder();
  }, [currentTime, toast]);

  // Real-time monitoring every second when camera is active
  useEffect(() => {
    if (!cameraActive || !attendanceSubmitted) return;

    const monitoringInterval = setInterval(() => {
      // Simulate face recognition detection (random chance for each student)
      const absentStudentsWithoutPermission = students.filter(
        s => !s.isPresent && !s.hasPermission
      );

      absentStudentsWithoutPermission.forEach(student => {
        // Simulate face recognition with 20% chance per second for each student
        const isRecognized = Math.random() < 0.2;
        
        if (isRecognized && !alertedStudentsThisHour.has(student.id)) {
          // Add student to alerted list for this hour
          setAlertedStudentsThisHour(prev => new Set([...prev, student.id]));
          
          // Create alert
          const newAlert: Alert = {
            id: `${Date.now()}-${student.id}`,
            studentName: student.name,
            timestamp: new Date().toLocaleTimeString(),
            message: "Face recognized outside without permission during class time"
          };
          
          setAlerts(prev => [newAlert, ...prev.slice(0, 7)]);
          
          // Show toast notification
          toast({
            title: "🚨 Student Alert",
            description: `${student.name} recognized outside without permission!`,
            variant: "destructive",
            duration: 5000,
          });
        }
      });
    }, 1000); // Monitor every second

    return () => clearInterval(monitoringInterval);
  }, [cameraActive, attendanceSubmitted, students, alertedStudentsThisHour, toast]);

  const handleAttendanceChange = (id: string, isPresent: boolean) => {
    setStudents(prev => 
      prev.map(student => 
        student.id === id ? { ...student, isPresent } : student
      )
    );
  };

  const handlePermissionChange = (id: string, hasPermission: boolean) => {
    setStudents(prev => 
      prev.map(student => 
        student.id === id ? { ...student, hasPermission } : student
      )
    );
  };

  const handleSubmitAttendance = () => {
    setAttendanceSubmitted(true);
    setCameraActive(true);
    
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
              <ClassSchedule />
              <CameraMonitor
                isActive={cameraActive}
                onToggleCamera={toggleCamera}
                alerts={alerts}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
