import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lightbulb, 
  Users, 
  AlertTriangle,
  Send,
  CheckCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const REPORT_TYPES = [
  {
    id: 'lighting_report',
    icon: Lightbulb,
    label: 'Street Lighting',
    description: 'Report well-lit or poorly-lit areas',
    points: 30,
    color: 'yellow'
  },
  {
    id: 'crowd_report',
    icon: Users,
    label: 'Crowd Level',
    description: 'Report how busy an area is',
    points: 20,
    color: 'blue'
  },
  {
    id: 'safety_report',
    icon: Shield,
    label: 'Safety Concern',
    description: 'Report safety issues or hazards',
    points: 25,
    color: 'green'
  },
  {
    id: 'route_feedback',
    icon: AlertTriangle,
    label: 'Route Feedback',
    description: 'Rate how safe a route felt',
    points: 10,
    color: 'orange'
  }
];

/**
 * Safety Report Modal for Solana rewards
 * Users can submit safety reports to earn points - NOW RECORDS ON-CHAIN!
 */
export const SafetyReportModal = ({ 
  isOpen, 
  onClose, 
  location,
  routeId,
  onReportSubmitted 
}) => {
  const { connected } = useWallet();
  const { recordSafetyReportOnChain, loading, safetyPoints } = useSolanaWallet();
  const { toast } = useToast();
  
  const [selectedType, setSelectedType] = useState(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const handleSubmit = async () => {
    if (!selectedType || !connected) return;

    try {
      const result = await recordSafetyReportOnChain({
        reportType: selectedType.id,
        details,
        location,
        routeId
      });

      setEarnedPoints(result.pointsEarned);
      setSubmitted(true);
      
      toast({
        title: "Report Recorded On-Chain! 🎉",
        description: `You earned ${result.pointsEarned} safety points! View on Solana Explorer.`,
      });

      if (onReportSubmitted) {
        onReportSubmitted(result);
      }

      // Reset after delay
      setTimeout(() => {
        setSubmitted(false);
        setSelectedType(null);
        setDetails('');
        onClose();
      }, 2000);

    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      yellow: isSelected 
        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' 
        : 'border-yellow-500/30 hover:border-yellow-500/60 text-yellow-400/70',
      blue: isSelected 
        ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
        : 'border-blue-500/30 hover:border-blue-500/60 text-blue-400/70',
      green: isSelected 
        ? 'bg-green-500/20 border-green-500 text-green-300' 
        : 'border-green-500/30 hover:border-green-500/60 text-green-400/70',
      orange: isSelected 
        ? 'bg-orange-500/20 border-orange-500 text-orange-300' 
        : 'border-orange-500/30 hover:border-orange-500/60 text-orange-400/70',
    };
    return colors[color] || colors.blue;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-purple-400" />
            Submit Safety Report
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Help make routes safer and earn Solana rewards
          </DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">Connect your Solana wallet to submit reports and earn rewards</p>
          </div>
        ) : submitted ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-400 mb-2">Report Submitted!</h3>
            <p className="text-slate-300">You earned +{earnedPoints} safety points</p>
            <p className="text-slate-400 text-sm mt-2">Total: {safetyPoints} points</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Report Type Selection */}
            <div className="space-y-2">
              <p className="text-sm text-slate-400 font-medium">Select report type:</p>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType?.id === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type)}
                      className={`p-3 rounded-lg border-2 transition-all ${getColorClasses(type.color, isSelected)}`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-xs opacity-70">+{type.points} pts</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details Input */}
            <AnimatePresence>
              {selectedType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <p className="text-sm text-slate-400 font-medium">
                    {selectedType.description}:
                  </p>
                  <Textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Add details about your observation..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Location Display */}
            {location && (
              <div className="text-xs text-slate-500 bg-slate-800/30 p-2 rounded">
                📍 Location: {location[0]?.toFixed(5)}, {location[1]?.toFixed(5)}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedType || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Submitting...' : `Submit Report (+${selectedType?.points || 0} pts)`}
            </Button>

            {/* Current Points */}
            <p className="text-center text-sm text-slate-500">
              Current balance: {safetyPoints} safety points
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * Quick Safety Report Button
 * Floating button to quickly submit safety reports
 */
export const SafetyReportButton = ({ location, routeId, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { connected } = useWallet();

  if (!connected) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 
          text-white rounded-full shadow-lg shadow-purple-500/30 font-medium ${className}`}
      >
        <Shield className="w-4 h-4" />
        Report Safety
      </motion.button>

      <SafetyReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        location={location}
        routeId={routeId}
      />
    </>
  );
};

export default SafetyReportModal;
