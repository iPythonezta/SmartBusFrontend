import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const RoutesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routesApi.getRoutes(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('routes.title')}</h1>
            <p className="text-muted-foreground mt-1">Manage bus routes and stops</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
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
          <h1 className="text-3xl font-bold">{t('routes.title')}</h1>
          <p className="text-muted-foreground mt-1">Manage bus routes and stops</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('routes.addRoute')}
        </Button>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routes?.map((route, index) => (
          <motion.div
            key={route.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: route.color || '#14b8a6' }}
                    >
                      {route.code}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{route.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {route.description || 'No description'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stop Count */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  <span className="font-medium">
                    {route.route_stops?.length || 0} stops
                  </span>
                </div>

                {/* Route Preview */}
                {route.route_stops && route.route_stops.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{route.route_stops[0].stop?.name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {route.route_stops[route.route_stops.length - 1].stop?.name}
                      </span>
                    </div>
                    {route.route_stops.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        Via {route.route_stops.length - 2} other stops
                      </p>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => navigate(`/routes/${route.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  View Route Details
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!routes || routes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No routes found</p>
              <p className="text-sm mt-2">Create your first route to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default RoutesPage;
