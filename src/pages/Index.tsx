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

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      description: "Camera monitoring has started automatically.",
      duration: 3000,
    });

    // Simulate finding absent students outside after a delay
    setTimeout(() => {
      const absentStudents = students.filter(s => !s.isPresent && !s.hasPermission);
      
      if (absentStudents.length > 0) {
        // Show notifications for ALL absent students when ANY detection occurs
        const newAlerts: Alert[] = absentStudents.map((student, index) => ({
          id: `${Date.now()}-${index}`,
          studentName: student.name,
          timestamp: new Date().toLocaleTimeString(),
          message: "Found outside without permission during class time"
        }));
        
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 8)); // Keep only 8 most recent alerts
        
        // Show main toast notification
        toast({
          title: `🚨 ALERT - ${absentStudents.length} Student${absentStudents.length > 1 ? 's' : ''} Detected`,
          description: `All absent students found outside without permission!`,
          variant: "destructive",
          duration: 8000,
        });
        
        // Show individual toasts for each student after a short delay
        absentStudents.forEach((student, index) => {
          setTimeout(() => {
            toast({
              title: "🚨 Individual Alert",
              description: `${student.name} detected outside without permission`,
              variant: "destructive",
              duration: 5000,
            });
          }, (index + 1) * 1000); // Stagger notifications by 1 second each
        });
      }
    }, 10000); // Simulate detection after 10 seconds
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
