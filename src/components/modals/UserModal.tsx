import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Shield, UserCheck } from 'lucide-react';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  user_type: z.enum(['ADMIN', 'STAFF']),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  isLoading?: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      user_type: 'STAFF',
    },
  });

  const watchedUserType = watch('user_type');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        user_type: 'STAFF',
      });
    }
  }, [isOpen, reset]);

  const handleFormSubmit = (data: UserFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New User
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              placeholder="John"
              {...register('first_name')}
            />
            {errors.first_name && (
              <p className="text-sm text-red-500">{errors.first_name.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              placeholder="Doe"
              {...register('last_name')}
            />
            {errors.last_name && (
              <p className="text-sm text-red-500">{errors.last_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* User Type */}
          <div className="space-y-2">
            <Label>User Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('user_type', 'STAFF')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  watchedUserType === 'STAFF'
                    ? 'bg-teal-100 text-teal-700 border-teal-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span className="font-medium">Staff</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('user_type', 'ADMIN')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  watchedUserType === 'ADMIN'
                    ? 'bg-purple-100 text-purple-700 border-purple-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span className="font-medium">Admin</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {watchedUserType === 'ADMIN' 
                ? 'Admins can manage users and have full access to all features.'
                : 'Staff members can view data but cannot edit or delete.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;
