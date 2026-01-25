import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  User, Heart, MapPin, History, Settings, 
  Trash2, Edit2, Save, X, Plus,
  Navigation, Shield, Zap, Scale
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const routeIcons = {
  safest: Shield,
  balanced: Scale,
  fastest: Zap,
  walking: Navigation
};

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [preferences, setPreferences] = useState({});

  // Fetch current user
  useEffect(() => {
    async function loadUser() {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setPreferences({
        comfort_profile: currentUser.comfort_profile || "balanced",
        transport_mode: currentUser.transport_mode || "walking",
        avoid_highways: currentUser.avoid_highways || false,
        avoid_tolls: currentUser.avoid_tolls || false,
        avoid_ferries: currentUser.avoid_ferries || false,
        accessibility_needs: currentUser.accessibility_needs || [],
        max_walking_distance_km: currentUser.max_walking_distance_km || 2,
        preferred_time_of_day: currentUser.preferred_time_of_day || "any",
        safety_priority: currentUser.safety_priority || 5
      });
    }
    loadUser();
  }, []);

  // Fetch favorites
  const { data: favoriteLocations = [] } = useQuery({
    queryKey: ["favoriteLocations"],
    queryFn: () => base44.entities.FavoriteLocation.list("-created_date"),
  });

  const { data: favoriteRoutes = [] } = useQuery({
    queryKey: ["favoriteRoutes"],
    queryFn: () => base44.entities.FavoriteRoute.list("-created_date"),
  });

  const { data: routeHistory = [] } = useQuery({
    queryKey: ["routeHistory"],
    queryFn: () => base44.entities.RouteHistory.list("-created_date", 50),
  });

  // Mutations
  const updatePrefsMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      toast.success("Preferences updated");
      setEditingPrefs(false);
      setUser({ ...user, ...preferences });
    },
  });

  const deleteFavoriteLocationMutation = useMutation({
    mutationFn: (id) => base44.entities.FavoriteLocation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoriteLocations"] });
      toast.success("Location removed");
    },
  });

  const deleteFavoriteRouteMutation = useMutation({
    mutationFn: (id) => base44.entities.FavoriteRoute.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoriteRoutes"] });
      toast.success("Route removed");
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: (id) => base44.entities.RouteHistory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeHistory"] });
      toast.success("History item removed");
    },
  });

  const handleSavePreferences = () => {
    updatePrefsMutation.mutate(preferences);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{user.full_name || "User"}</h1>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            {/* Favorite Locations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Favorite Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoriteLocations.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No favorite locations yet</p>
                ) : (
                  <div className="space-y-3">
                    {favoriteLocations.map((location) => (
                      <motion.div
                        key={location.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start justify-between p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{location.name}</h4>
                          <p className="text-sm text-slate-500 mt-1">{location.address || location.type}</p>
                          {location.notes && (
                            <p className="text-sm text-slate-600 mt-2 italic">{location.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFavoriteLocationMutation.mutate(location.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorite Routes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Favorite Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoriteRoutes.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No favorite routes yet</p>
                ) : (
                  <div className="space-y-3">
                    {favoriteRoutes.map((route) => {
                      const RouteIcon = routeIcons[route.route_type] || Navigation;
                      return (
                        <motion.div
                          key={route.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start justify-between p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <RouteIcon className="w-4 h-4 text-blue-500" />
                              <h4 className="font-semibold text-slate-800">{route.route_name}</h4>
                              <Badge variant="outline" className="capitalize">{route.route_type}</Badge>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              {route.origin_label} → {route.dest_label}
                            </p>
                            {route.eta_minutes && (
                              <p className="text-sm text-slate-600 mt-1">~{route.eta_minutes} min</p>
                            )}
                            {route.notes && (
                              <p className="text-sm text-slate-600 mt-2 italic">{route.notes}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFavoriteRouteMutation.mutate(route.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Route History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routeHistory.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No route history yet</p>
                ) : (
                  <div className="space-y-3">
                    {routeHistory.map((item) => {
                      const RouteIcon = routeIcons[item.route_type] || Navigation;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start justify-between p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <RouteIcon className="w-4 h-4 text-blue-500" />
                              <Badge variant={item.mode === "night" ? "secondary" : "outline"}>
                                {item.mode}
                              </Badge>
                              <Badge variant="outline" className="capitalize">{item.route_type}</Badge>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">
                              {item.origin_label || "Unknown"} → {item.dest_label || "Unknown"}
                            </p>
                            {item.eta_minutes && (
                              <p className="text-sm text-slate-500 mt-1">~{item.eta_minutes} min</p>
                            )}
                            <p className="text-xs text-slate-400 mt-2">
                              {new Date(item.created_date).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteHistoryMutation.mutate(item.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Route Planning Preferences</CardTitle>
                {!editingPrefs ? (
                  <Button onClick={() => setEditingPrefs(true)} size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setEditingPrefs(false)} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSavePreferences} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comfort Profile */}
                <div className="space-y-2">
                  <Label>Comfort Profile</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["cautious", "balanced", "speed-focused"].map((profile) => (
                      <button
                        key={profile}
                        disabled={!editingPrefs}
                        onClick={() => setPreferences({ ...preferences, comfort_profile: profile })}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          preferences.comfort_profile === profile
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        } ${!editingPrefs && "opacity-60 cursor-not-allowed"}`}
                      >
                        {profile.charAt(0).toUpperCase() + profile.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transport Mode */}
                <div className="space-y-2">
                  <Label>Preferred Transport Mode</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["walking", "cycling", "transit"].map((mode) => (
                      <button
                        key={mode}
                        disabled={!editingPrefs}
                        onClick={() => setPreferences({ ...preferences, transport_mode: mode })}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          preferences.transport_mode === mode
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        } ${!editingPrefs && "opacity-60 cursor-not-allowed"}`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Avoidance Options */}
                <div className="space-y-4">
                  <Label>Route Avoidances</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Avoid highways</span>
                      <Switch
                        disabled={!editingPrefs}
                        checked={preferences.avoid_highways}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, avoid_highways: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Avoid tolls</span>
                      <Switch
                        disabled={!editingPrefs}
                        checked={preferences.avoid_tolls}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, avoid_tolls: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Avoid ferries</span>
                      <Switch
                        disabled={!editingPrefs}
                        checked={preferences.avoid_ferries}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, avoid_ferries: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Max Walking Distance */}
                <div className="space-y-2">
                  <Label>Maximum Walking Distance: {preferences.max_walking_distance_km} km</Label>
                  <Slider
                    disabled={!editingPrefs}
                    value={[preferences.max_walking_distance_km]}
                    onValueChange={([value]) =>
                      setPreferences({ ...preferences, max_walking_distance_km: value })
                    }
                    min={0.5}
                    max={10}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                {/* Safety Priority */}
                <div className="space-y-2">
                  <Label>Safety Priority: {preferences.safety_priority}/10</Label>
                  <Slider
                    disabled={!editingPrefs}
                    value={[preferences.safety_priority]}
                    onValueChange={([value]) =>
                      setPreferences({ ...preferences, safety_priority: value })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Preferred Time */}
                <div className="space-y-2">
                  <Label>Preferred Time of Day</Label>
                  <select
                    disabled={!editingPrefs}
                    value={preferences.preferred_time_of_day}
                    onChange={(e) =>
                      setPreferences({ ...preferences, preferred_time_of_day: e.target.value })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="any">Any time</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}