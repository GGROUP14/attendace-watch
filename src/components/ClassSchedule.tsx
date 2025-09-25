import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee } from "lucide-react";

interface ScheduleItem {
  start: string;
  end: string;
  type: 'class' | 'break';
  current?: boolean;
}

export const ClassSchedule = () => {
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
    
    return schedule.findIndex(slot => 
      currentTime >= slot.start && currentTime < slot.end
    );
  };

  const currentSlotIndex = getCurrentTimeSlot();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Today's Schedule</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {schedule.map((slot, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              index === currentSlotIndex 
                ? 'bg-primary/10 border-primary' 
                : 'bg-muted/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              {slot.type === 'break' && <Coffee className="h-4 w-4 text-muted-foreground" />}
              <span className="font-medium">
                {slot.start} - {slot.end}
              </span>
            </div>
            
            <Badge 
              variant={slot.type === 'class' ? 'default' : 'secondary'}
              className={index === currentSlotIndex ? 'bg-primary text-primary-foreground' : ''}
            >
              {slot.type === 'class' ? 'Class' : 'Break'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};