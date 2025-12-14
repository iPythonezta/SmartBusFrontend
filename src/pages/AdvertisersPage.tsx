import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisersApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building2, Search, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Advertiser } from '@/types/advertiser';

interface AdvertiserFormData {
  advertiser_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
}

const AdvertisersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState<AdvertiserFormData>({
    advertiser_name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<AdvertiserFormData>>({});

  const { data: advertisers, isLoading } = useQuery({
    queryKey: ['advertisers'],
    queryFn: () => advertisersApi.getAdvertisers(),
  });

  // Filter advertisers by search query
  const filteredAdvertisers = useMemo(() => {
    if (!advertisers) return [];
    const list = (advertisers as any).data ?? advertisers;
    if (!Array.isArray(list)) return [];
    
    if (!searchQuery.trim()) return list;
    
    const query = searchQuery.toLowerCase();
    return list.filter((adv: Advertiser) => 
      adv.name.toLowerCase().includes(query) ||
      (adv.contact_email || '').toLowerCase().includes(query) ||
      (adv.contact_phone || '').toLowerCase().includes(query)
    );
  }, [advertisers, searchQuery]);

  // Mutations
  const createAdvertiserMutation = useMutation({
    mutationFn: (data: AdvertiserFormData) => advertisersApi.createAdvertiser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: 'Advertiser Created', description: 'Advertiser has been added successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create advertiser.', variant: 'destructive' });
    },
  });

  const updateAdvertiserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdvertiserFormData> }) => 
      advertisersApi.updateAdvertiser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      setIsModalOpen(false);
      setEditingAdvertiser(null);
      resetForm();
      toast({ title: 'Advertiser Updated', description: 'Advertiser has been updated successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update advertiser.', variant: 'destructive' });
    },
  });

  const deleteAdvertiserMutation = useMutation({
    mutationFn: (id: number) => advertisersApi.deleteAdvertiser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      queryClient.invalidateQueries({ queryKey: ['ads'] }); // Refresh ads in case they were affected
      setDeleteConfirmId(null);
      toast({ title: 'Advertiser Deleted', description: 'Advertiser has been removed.' });
    },
    onError: (error: any) => {
      const message = error?.response?.status === 409
        ? 'Cannot delete advertiser with active advertisements.'
        : 'Failed to delete advertiser.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      advertiser_name: '',
      contact_phone: '',
      contact_email: '',
      address: '',
    });
    setFormErrors({});
  };

  const handleAdd = () => {
    setEditingAdvertiser(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (advertiser: Advertiser) => {
    setEditingAdvertiser(advertiser);
    setFormData({
      advertiser_name: advertiser.name,
      contact_phone: advertiser.contact_phone || '',
      contact_email: advertiser.contact_email || '',
      address: advertiser.address || '',
    });
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<AdvertiserFormData> = {};
    
    if (!formData.advertiser_name.trim()) {
      errors.advertiser_name = 'Advertiser name is required';
    } else if (formData.advertiser_name.trim().length < 2) {
      errors.advertiser_name = 'Name must be at least 2 characters';
    }

    if (formData.contact_email && !formData.contact_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.contact_email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (editingAdvertiser) {
      updateAdvertiserMutation.mutate({ id: editingAdvertiser.id, data: formData });
    } else {
      createAdvertiserMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Advertisers</h1>
            <p className="text-muted-foreground mt-1">Manage advertiser companies and contacts</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advertisers</h1>
          <p className="text-muted-foreground mt-1">Manage advertiser companies and contacts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search advertisers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Add Advertiser
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Advertisers</p>
              <p className="text-2xl font-bold">{filteredAdvertisers.length}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertisers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAdvertisers.map((advertiser: Advertiser, index: number) => (
          <motion.div
            key={advertiser.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all hover:border-purple-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    {advertiser.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  {advertiser.contact_phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="text-xs">{advertiser.contact_phone}</span>
                    </div>
                  )}
                  
                  {advertiser.contact_email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs">{advertiser.contact_email}</span>
                    </div>
                  )}

                  {advertiser.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs">{advertiser.address}</span>
                    </div>
                  )}

                  {!advertiser.contact_phone && !advertiser.contact_email && !advertiser.address && (
                    <p className="text-xs text-muted-foreground italic">No contact details</p>
                  )}
                </div>

                {/* Delete Confirmation */}
                {deleteConfirmId === advertiser.id ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                    <p className="text-sm text-red-700">Delete this advertiser?</p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAdvertiserMutation.mutate(advertiser.id)}
                        disabled={deleteAdvertiserMutation.isPending}
                      >
                        {deleteAdvertiserMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(advertiser)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteConfirmId(advertiser.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAdvertisers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Advertisers</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first advertiser company.</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Advertiser
            </Button>
          </div>
        </Card>
      )}

      {/* Advertiser Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAdvertiser ? 'Edit Advertiser' : 'Add New Advertiser'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="advertiser_name">Company/Advertiser Name *</Label>
              <Input
                id="advertiser_name"
                placeholder="e.g., Jazz Pakistan"
                value={formData.advertiser_name}
                onChange={(e) => setFormData({ ...formData, advertiser_name: e.target.value })}
              />
              {formErrors.advertiser_name && (
                <p className="text-sm text-red-500">{formErrors.advertiser_name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                placeholder="e.g., +92 300 1234567"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="e.g., contact@company.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
              {formErrors.contact_email && (
                <p className="text-sm text-red-500">{formErrors.contact_email}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="e.g., Islamabad, Pakistan"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAdvertiser(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAdvertiserMutation.isPending || updateAdvertiserMutation.isPending}
              >
                {createAdvertiserMutation.isPending || updateAdvertiserMutation.isPending
                  ? 'Saving...'
                  : editingAdvertiser
                  ? 'Update Advertiser'
                  : 'Add Advertiser'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvertisersPage;
