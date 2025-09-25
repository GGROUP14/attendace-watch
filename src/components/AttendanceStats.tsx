import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield } from "lucide-react";

interface AttendanceStatsProps {
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  permittedStudents: number;
}

export const AttendanceStats = ({
  totalStudents,
  presentStudents,
  absentStudents,
  permittedStudents,
}: AttendanceStatsProps) => {
  const stats = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Present",
      value: presentStudents,
      icon: UserCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Absent",
      value: absentStudents,
      icon: UserX,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Permitted",
      value: permittedStudents,
      icon: Shield,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};