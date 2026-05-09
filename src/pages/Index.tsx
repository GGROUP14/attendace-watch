import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { StudentCard } from "@/components/StudentCard";
import { ClassSchedule } from "@/components/ClassSchedule";
import { CameraMonitor } from "@/components/CameraMonitor";
import { AttendanceStats } from "@/components/AttendanceStats";
import { AddStudentForm } from "@/components/AddStudentForm";
import { GraduationCap, Save, AlertCircle, ScanFace, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const [autoMarkingActive, setAutoMarkingActive] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const alertedStudentsThisHourRef = useRef<Set<string>>(new Set());
  const autoMarkedStudentsRef = useRef<Set<string>>(new Set());
  const attendanceSubmittedRef = useRef(false);
  const autoMarkingActiveRef = useRef(false);
  const studentsRef = useRef<Student[]>([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

  // Keep studentsRef in sync
  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  // Update current time every second and reset hourly alerts tracker
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date();
      const currentHour = newTime.getHours();
      const prevHour = currentTime.getHours();
      
      setCurrentTime(newTime);
      
      // Reset alerted students tracker when hour changes
      if (currentHour !== prevHour) {
        alertedStudentsThisHourRef.current = new Set();
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

  const [faceDetectionActive, setFaceDetectionActive] = useState(false);

  // Handle face detection from camera
  const handleFaceDetected = (detected: boolean, detectedStudentId?: string) => {
    setFaceDetectionActive(detected);
    
    if (!detected || !cameraActive) return;
    
    if (detectedStudentId) {
      const detectedStudent = studentsRef.current.find(s => s.id === detectedStudentId);
      if (!detectedStudent) return;
      
      // Auto-mark attendance only when autoMarkingActive (before submit)
      if (autoMarkingActiveRef.current && !attendanceSubmittedRef.current && !detectedStudent.isPresent && !autoMarkedStudentsRef.current.has(detectedStudent.id)) {
        autoMarkedStudentsRef.current.add(detectedStudent.id);
        handleAttendanceChange(detectedStudent.id, true);
        sonnerToast.success(`✅ ${detectedStudent.name} marked present via face recognition`);
      }
      
      // Post-submission monitoring: alert if recognized student is absent without permission
      if (attendanceSubmittedRef.current && !detectedStudent.isPresent && !detectedStudent.hasPermission && !alertedStudentsThisHourRef.current.has(detectedStudent.id)) {
        alertedStudentsThisHourRef.current.add(detectedStudent.id);
        
        const alertTime = new Date().toLocaleTimeString();
        const newAlert: Alert = {
          id: `${detectedStudent.id}-${Date.now()}`,
          studentName: detectedStudent.name,
          timestamp: alertTime,
          message: `${detectedStudent.name} has not attended the class!`,
        };
        
        setAlerts(prev => [newAlert, ...prev]);
        
        sonnerToast.warning(`⚠️ ${detectedStudent.name} has not attended the class!`);
        
        // Send alert email
        supabase.functions.invoke('send-alert-email', {
          body: {
            studentName: detectedStudent.name,
            timestamp: alertTime,
            message: `${detectedStudent.name} has not attended the class.`,
          },
        }).then(({ error }) => {
          if (error) {
            console.error('Failed to send alert email:', error);
          } else {
            console.log(`Alert email sent for ${detectedStudent.name}`);
          }
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

  const handleDeleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting student:', error);
        sonnerToast.error("Failed to delete student");
        return;
      }

      setStudents(prev => prev.filter(student => student.id !== id));
      sonnerToast.success("Student deleted successfully");
    } catch (error) {
      console.error('Error deleting student:', error);
      sonnerToast.error("Failed to delete student");
    }
  };

  // Handle auto-mark attendance via camera
  const handleMarkAttendance = async () => {
    // Clear previous attendance & permissions for all students
    const { error } = await supabase
      .from("students")
      .update({ is_present: false, has_permission: false })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reset previous attendance.",
        variant: "destructive",
      });
      return;
    }

    setStudents((prev) =>
      prev.map((s) => ({ ...s, isPresent: false, hasPermission: false }))
    );

    setAttendanceSubmitted(false);
    attendanceSubmittedRef.current = false;
    setAutoMarkingActive(true);
    autoMarkingActiveRef.current = true;
    autoMarkedStudentsRef.current = new Set();
    alertedStudentsThisHourRef.current = new Set();
    setAlerts([]);
    setCameraActive(true);

    toast({
      title: "📸 Auto Attendance Started",
      description: "Previous records cleared. Camera is active.",
      duration: 3000,
    });
  };

  const handleSubmitAttendance = () => {
    setAttendanceSubmitted(true);
    attendanceSubmittedRef.current = true;
    setAutoMarkingActive(false);
    autoMarkingActiveRef.current = false;
    setCameraActive(true);
    
    // Clear any existing alerts and reset hourly tracker
    setAlerts([]);
    alertedStudentsThisHourRef.current = new Set();
    
    console.log("Attendance submitted - monitoring will start in 1 second intervals");
    
    toast({
      title: "✅ Attendance Submitted",
      description: "Attendance locked. Real-time monitoring has started.",
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
                <h1 className="text-2xl font-bold">EDUGUARD</h1>
                <p className="text-sm text-muted-foreground">
                  {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleMarkAttendance}
                
                variant="outline"
              >
                <ScanFace className="h-4 w-4 mr-2" />
                {autoMarkingActive ? "Marking..." : "Mark Attendance"}
              </Button>
              <Button 
                onClick={handleSubmitAttendance}
                
                className="bg-success hover:bg-success/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Submit Attendance
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="icon" aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
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
                      onDelete={handleDeleteStudent}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <AddStudentForm onStudentAdded={fetchStudents} />
              <ClassSchedule students={students} />
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
