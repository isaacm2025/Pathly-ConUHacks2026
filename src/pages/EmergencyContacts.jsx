import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Phone,
  MessageSquare,
  MapPin,
  Shield,
  Trash2,
  Edit2,
  Star,
  StarOff,
  Clock,
  Bell,
  Share2,
  AlertTriangle,
  CheckCircle,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createPageUrl } from "../utils";

// Local storage key
const CONTACTS_STORAGE_KEY = "pathly_emergency_contacts";
const SETTINGS_STORAGE_KEY = "pathly_emergency_settings";

// Default emergency services
const DEFAULT_SERVICES = [
  { id: "911", name: "Emergency Services", phone: "911", type: "emergency", icon: "🚨" },
  { id: "police", name: "Police (Non-Emergency)", phone: "514-280-2222", type: "service", icon: "👮" },
  { id: "campus", name: "Campus Security", phone: "514-398-3000", type: "service", icon: "🏫" },
];

export default function EmergencyContacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [settings, setSettings] = useState({
    autoShareLocation: true,
    checkInReminders: false,
    checkInInterval: 30, // minutes
    panicButtonEnabled: true,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [panicSent, setPanicSent] = useState(false);

  // Load contacts from localStorage
  useEffect(() => {
    const savedContacts = localStorage.getItem(CONTACTS_STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save contacts to localStorage
  const saveContacts = (newContacts) => {
    setContacts(newContacts);
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(newContacts));
  };

  // Save settings to localStorage
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  // Add or edit contact
  const handleSaveContact = (contact) => {
    if (editingContact) {
      const updated = contacts.map((c) =>
        c.id === editingContact.id ? { ...contact, id: editingContact.id } : c
      );
      saveContacts(updated);
    } else {
      const newContact = {
        ...contact,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      saveContacts([...contacts, newContact]);
    }
    setShowAddModal(false);
    setEditingContact(null);
  };

  // Delete contact
  const handleDeleteContact = () => {
    if (contactToDelete) {
      saveContacts(contacts.filter((c) => c.id !== contactToDelete.id));
      setContactToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  // Toggle primary contact
  const togglePrimary = (contactId) => {
    const updated = contacts.map((c) => ({
      ...c,
      isPrimary: c.id === contactId ? !c.isPrimary : false,
    }));
    saveContacts(updated);
  };

  // Make a call
  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  // Send SMS with location
  const handleSendLocation = (contact) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
          const message = `🚨 Pathly Safety Alert: I'm sharing my location with you. ${mapsUrl}`;
          window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
        },
        () => {
          // Fallback without location
          const message = `🚨 Pathly Safety Alert: I wanted to let you know I'm walking home. I'll check in soon.`;
          window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
        }
      );
    }
  };

  // Panic button - alert all contacts
  const handlePanic = () => {
    setShowPanicConfirm(false);
    setPanicSent(true);

    // Get current location and send to all contacts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        
        // In a real app, this would send SMS/notifications via backend
        console.log("PANIC ALERT sent to all contacts with location:", mapsUrl);
        
        // Show confirmation for 3 seconds
        setTimeout(() => setPanicSent(false), 3000);
      });
    }
  };

  const primaryContact = contacts.find((c) => c.isPrimary);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-lg border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(createPageUrl("Home"))}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Emergency Contacts</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 -mr-2 rounded-xl hover:bg-slate-800 transition-colors text-emerald-400"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        {/* Panic Button */}
        {settings.panicButtonEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => setShowPanicConfirm(true)}
              className="w-full p-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 
                         shadow-lg shadow-red-500/30 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-center gap-3">
                <AlertTriangle className="w-8 h-8 text-white" />
                <div className="text-left">
                  <p className="text-white font-bold text-lg">Emergency Alert</p>
                  <p className="text-red-100 text-sm">Tap to alert all contacts with your location</p>
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {/* Panic Sent Confirmation */}
        <AnimatePresence>
          {panicSent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-24 z-50 p-4 rounded-2xl bg-emerald-500 shadow-lg"
            >
              <div className="flex items-center gap-3 text-white">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Alert Sent!</p>
                  <p className="text-sm text-emerald-100">All contacts have been notified</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Contact Quick Actions */}
        {primaryContact && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-violet-500/30 flex items-center justify-center">
                <Star className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-violet-300 text-xs font-medium">PRIMARY CONTACT</p>
                <p className="text-white font-semibold">{primaryContact.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleCall(primaryContact.phone)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
              >
                <Phone className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-emerald-300">Call</span>
              </button>
              <button
                onClick={() => handleSendLocation(primaryContact)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
              >
                <MapPin className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-blue-300">Share Location</span>
              </button>
              <button
                onClick={() => window.location.href = `sms:${primaryContact.phone}`}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-purple-300">Message</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Emergency Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-medium text-slate-400 mb-3 px-1">Emergency Services</h2>
          <div className="space-y-2">
            {DEFAULT_SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => handleCall(service.phone)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 
                           hover:border-slate-700 transition-colors text-left"
              >
                <span className="text-2xl">{service.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-medium">{service.name}</p>
                  <p className="text-slate-400 text-sm">{service.phone}</p>
                </div>
                <Phone className="w-5 h-5 text-emerald-400" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* My Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-medium text-slate-400 mb-3 px-1">My Trusted Contacts</h2>
          
          {contacts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 border-dashed text-center">
              <User className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No trusted contacts yet</p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">{contact.name}</p>
                      {contact.isPrimary && (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{contact.phone}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePrimary(contact.id)}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                      title={contact.isPrimary ? "Remove as primary" : "Set as primary"}
                    >
                      {contact.isPrimary ? (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <StarOff className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCall(contact.phone)}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => handleSendLocation(contact)}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingContact(contact);
                        setShowAddModal(true);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        setContactToDelete(contact);
                        setShowDeleteDialog(true);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Safety Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-sm font-medium text-slate-400 mb-3 px-1">Safety Settings</h2>
          <div className="space-y-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Auto-share Location</p>
                  <p className="text-slate-500 text-xs">Include location when alerting contacts</p>
                </div>
              </div>
              <Switch
                checked={settings.autoShareLocation}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, autoShareLocation: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Check-in Reminders</p>
                  <p className="text-slate-500 text-xs">Remind me to check in during walks</p>
                </div>
              </div>
              <Switch
                checked={settings.checkInReminders}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, checkInReminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Panic Button</p>
                  <p className="text-slate-500 text-xs">Show emergency alert button</p>
                </div>
              </div>
              <Switch
                checked={settings.panicButtonEnabled}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, panicButtonEnabled: checked })
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Safety Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-400 font-medium text-sm">Safety Tip</p>
              <p className="text-emerald-300/80 text-sm mt-1">
                Share your live location with a trusted contact before walking alone at night. 
                They can track your journey in real-time.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Contact Modal */}
      <ContactModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        contact={editingContact}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to remove {contactToDelete?.name} from your emergency contacts?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Panic Confirmation */}
      <AlertDialog open={showPanicConfirm} onOpenChange={setShowPanicConfirm}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Send Emergency Alert?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will send an emergency alert with your current location to all your trusted contacts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePanic}
              className="bg-red-500 hover:bg-red-600"
            >
              Send Alert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Contact Add/Edit Modal Component
function ContactModal({ isOpen, onClose, onSave, contact }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  useEffect(() => {
    if (contact) {
      setName(contact.name || "");
      setPhone(contact.phone || "");
      setRelationship(contact.relationship || "");
    } else {
      setName("");
      setPhone("");
      setRelationship("");
    }
  }, [contact, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && phone) {
      onSave({ name, phone, relationship });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "Add Trusted Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name" className="text-slate-300">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="mt-1 bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="mt-1 bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="relationship" className="text-slate-300">Relationship (optional)</Label>
            <Input
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Friend, Family, Roommate..."
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
              {contact ? "Save Changes" : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
