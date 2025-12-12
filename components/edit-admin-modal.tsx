'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { School, Building2, FileText, Target, RefreshCw } from 'lucide-react';

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminUser | null;
  onSave: (updatedAdmin: AdminUser) => void;
  isLoading: boolean;
  savedPassword?: string; // Pass the saved password from parent
}

interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  permissions?: string[];
  [key: string]: any;
}

const MODULES = [
  { id: "inquiries", name: "Inquiries", icon: FileText },
  { id: "enrollment", name: "Enrollment", icon: Building2 },
  { id: "marketing", name: "Marketing Activities", icon: Target },
  { id: "schools", name: "Schools", icon: School },
];

// Generate a random password that meets Supabase requirements (min 8 characters)
const generateRandomPassword = (): string => {
  const length = 12; // Use 12 characters for better security
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export const EditAdminModal: React.FC<EditAdminModalProps> = ({ isOpen, onClose, admin, onSave, isLoading, savedPassword }) => {
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [hasNewPassword, setHasNewPassword] = useState(false);

  useEffect(() => {
    if (admin) {
      setEditedFirstName(admin.first_name || '');
      setEditedLastName(admin.last_name || '');
      setEditedPermissions(admin.permissions || []);
      // Show saved password if available (last superadmin-generated password)
      // If admin changed their password, savedPassword will be empty (privacy)
      if (savedPassword) {
        setPassword(savedPassword);
      } else {
        setPassword('');
      }
      // Reset the new password flag when modal opens
      setHasNewPassword(false);
    } else {
      setEditedFirstName('');
      setEditedLastName('');
      setEditedPermissions([]);
      setPassword('');
      setHasNewPassword(false);
    }
  }, [admin, savedPassword]);

  const handleModuleToggle = (moduleId: string) => {
    setEditedPermissions(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId]
    );
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setPassword(newPassword);
    setHasNewPassword(true); // Mark that a new password was generated
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (admin) {
      const updatedAdmin: any = {
        ...admin,
        first_name: editedFirstName,
        last_name: editedLastName,
        permissions: editedPermissions,
      };
      
      // Only send password if a new one was generated (user clicked Generate)
      if (hasNewPassword && password) {
        updatedAdmin.password = password;
      }
      
      onSave(updatedAdmin);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Admin Account</DialogTitle>
          <DialogDescription>
            Make changes to admin user. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" defaultValue={admin?.email} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">First Name</Label>
              <Input id="firstName" value={editedFirstName} onChange={(e) => setEditedFirstName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">Last Name</Label>
              <Input id="lastName" value={editedLastName} onChange={(e) => setEditedLastName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Password</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input 
                    id="password" 
                    type="text" 
                    value={password || ""} 
                    readOnly 
                    className="bg-gray-50 font-mono flex-1" 
                    placeholder={savedPassword ? "Last generated password (admin may have changed it)" : "No password generated yet"}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePassword}
                    className="shrink-0"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reset Password
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasNewPassword 
                    ? "A new password has been generated. Click 'Save changes' to reset the admin's password."
                    : savedPassword
                      ? "This is the last password generated by superadmin. If the admin changed their password, it won't be shown here for privacy. Click 'Reset Password' to generate a new one."
                      : "No password has been generated yet. Click 'Reset Password' to generate a new password for this admin."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Permissions</Label>
              <div className="col-span-3 space-y-2">
                {MODULES.map(({ id, name, icon: Icon }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-module-${id}`}
                      checked={editedPermissions.includes(id)}
                      onCheckedChange={() => handleModuleToggle(id)}
                    />
                    <Label htmlFor={`edit-module-${id}`} className="flex items-center space-x-2 font-normal">
                      <Icon className="h-4 w-4" />
                      <span>{name}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

