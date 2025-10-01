import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StudentCardProps {
  id: string;
  name: string;
  image: string;
  isPresent: boolean;
  hasPermission: boolean;
  onAttendanceChange: (id: string, isPresent: boolean) => void;
  onPermissionChange: (id: string, hasPermission: boolean) => void;
  onDelete: (id: string) => void;
}

export const StudentCard = ({
  id,
  name,
  image,
  isPresent,
  hasPermission,
  onAttendanceChange,
  onPermissionChange,
  onDelete,
}: StudentCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground">{name}</h3>
            <div className="flex items-center space-x-4 mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={isPresent}
                  onCheckedChange={(checked) => 
                    onAttendanceChange(id, checked as boolean)
                  }
                />
                <span className="text-sm">Present</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={hasPermission}
                  onCheckedChange={(checked) => 
                    onPermissionChange(id, checked as boolean)
                  }
                />
                <span className="text-sm">Permission</span>
              </label>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col space-y-1">
              {isPresent && (
                <Badge variant="outline" className="bg-success/10 text-success border-success">
                  Present
                </Badge>
              )}
              {!isPresent && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                  Absent
                </Badge>
              )}
              {hasPermission && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                  Permitted
                </Badge>
              )}
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Student</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {name}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};