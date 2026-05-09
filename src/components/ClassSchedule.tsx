import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScheduleItem {
  start: string;
  end: string;
  type: 'class' | 'break';
}

interface Student {
  id: string;
  name: string;
  isPresent: boolean;
  hasPermission: boolean;
}

interface ClassScheduleProps {
  students?: Student[];
}

export const ClassSchedule = ({ students = [] }: ClassScheduleProps) => {
  const [selectedSlot, setSelectedSlot] = useState<ScheduleItem | null>(null);

  const schedule: ScheduleItem[] = [
    { start: "09:00", end: "10:00", type: 'class' },
    { start: "10:00", end: "10:45", type: 'class' },
    { start: "10:45", end: "11:00", type: 'break' },
    { start: "11:00", end: "12:00", type: 'class' },
    { start: "12:00", end: "12:45", type: 'class' },
    { start: "12:45", end: "13:30", type: 'break' },
    { start: "13:30", end: "14:30", type: 'class' },
    { start: "14:30", end: "15:30", type: 'class' },
    { start: "15:30", end: "15:45", type: 'break' },
    { start: "15:45", end: "16:20", type: 'class' },
  ];

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return schedule.findIndex(slot => currentTime >= slot.start && currentTime < slot.end);
  };

  const currentSlotIndex = getCurrentTimeSlot();

  const getStatus = (s: Student) => {
    if (s.isPresent) return { label: "Present", icon: CheckCircle2, className: "text-success" };
    if (s.hasPermission) return { label: "Permission", icon: ShieldCheck, className: "text-warning" };
    return { label: "Absent", icon: XCircle, className: "text-destructive" };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Today's Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedule.map((slot, index) => (
            <button
              key={index}
              type="button"
              onClick={() => slot.type === 'class' && setSelectedSlot(slot)}
              disabled={slot.type !== 'class'}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                index === currentSlotIndex
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted/50'
              } ${slot.type === 'class' ? 'hover:bg-accent cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-center space-x-3">
                {slot.type === 'break' && <Coffee className="h-4 w-4 text-muted-foreground" />}
                <span className="font-medium">{slot.start} - {slot.end}</span>
              </div>
              <Badge
                variant={slot.type === 'class' ? 'default' : 'secondary'}
                className={index === currentSlotIndex ? 'bg-primary text-primary-foreground' : ''}
              >
                {slot.type === 'class' ? 'Class' : 'Break'}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Attendance Sheet — {selectedSlot?.start} to {selectedSlot?.end}
            </DialogTitle>
            <DialogDescription>
              Current attendance and permission status for all students.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No students found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => {
                    const status = getStatus(s);
                    const Icon = status.icon;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className={`text-right ${status.className}`}>
                          <span className="inline-flex items-center gap-1">
                            <Icon className="h-4 w-4" />
                            {status.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            <div className="mt-4 text-xs text-muted-foreground flex gap-4 justify-center">
              <span>Present: {students.filter(s => s.isPresent).length}</span>
              <span>Permission: {students.filter(s => !s.isPresent && s.hasPermission).length}</span>
              <span>Absent: {students.filter(s => !s.isPresent && !s.hasPermission).length}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
