import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { motion } from 'framer-motion';
import { 
  Send, 
  Heart,
  CheckCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const TIP_AMOUNTS = [
  { amount: 0.001, label: '☕ 0.001 SOL' },
  { amount: 0.005, label: '🌟 0.005 SOL' },
  { amount: 0.01, label: '🎉 0.01 SOL' },
  { amount: 0.05, label: '🚀 0.05 SOL' },
];

/**
 * Solana Tip Modal Component
 * Allows users to send real SOL tips to safety contributors
 */
export const TipModal = ({ 
  isOpen, 
  onClose, 
  recipientAddress,
  recipientName = 'Safety Contributor',
  onTipSent 
}) => {
  const { connected } = useWallet();
  const { sendTip, loading, balance } = useSolanaWallet();
  const { toast } = useToast();
  
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [tipResult, setTipResult] = useState(null);

  const getTipAmount = () => {
    if (selectedAmount !== null) return selectedAmount;
    const custom = parseFloat(customAmount);
    return isNaN(custom) ? 0 : custom;
  };

  const handleSendTip = async () => {
    const amount = getTipAmount();
    if (amount <= 0 || !recipientAddress) return;

    try {
      const result = await sendTip(recipientAddress, amount, message);
      setTipResult(result);
      
      toast({
        title: "Tip Sent! 💰",
        description: `Successfully sent ${amount} SOL`,
      });

      if (onTipSent) {
        onTipSent(result);
      }

    } catch (error) {
      toast({
        title: "Tip Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetAndClose = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setMessage('');
    setTipResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="w-5 h-5 text-pink-400" />
            Send Tip
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Thank {recipientName} with a SOL tip (Real blockchain transaction!)
          </DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">Connect your wallet to send tips</p>
          </div>
        ) : tipResult ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8 space-y-4"
          >
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Tip Sent!</p>
              <p className="text-slate-400">{tipResult.amount} SOL sent successfully</p>
            </div>
            <a
              href={tipResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
            >
              View on Solana Explorer <ExternalLink className="w-4 h-4" />
            </a>
            <Button onClick={resetAndClose} className="w-full mt-4">
              Done
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Recipient Info */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Sending to:</p>
              <p className="text-white font-medium">{recipientName}</p>
              <p className="text-xs text-slate-500 font-mono truncate">{recipientAddress}</p>
            </div>

            {/* Quick Amount Selection */}
            <div className="space-y-2">
              <p className="text-sm text-slate-300">Select Amount</p>
              <div className="grid grid-cols-2 gap-2">
                {TIP_AMOUNTS.map((tip) => (
                  <button
                    key={tip.amount}
                    onClick={() => {
                      setSelectedAmount(tip.amount);
                      setCustomAmount('');
                    }}
                    className={`p-3 rounded-lg border transition-all text-sm ${
                      selectedAmount === tip.amount
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'border-slate-600 hover:border-purple-500/50 text-slate-300'
                    }`}
                  >
                    {tip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <p className="text-sm text-slate-300">Or enter custom amount (SOL)</p>
              <Input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                step="0.001"
                min="0"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            {/* Optional Message */}
            <div className="space-y-2">
              <p className="text-sm text-slate-300">Add a message (optional)</p>
              <Input
                placeholder="Thanks for the safety info!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            {/* Balance Warning */}
            {balance !== null && getTipAmount() > balance && (
              <p className="text-red-400 text-sm">
                Insufficient balance. You have {balance.toFixed(4)} SOL
              </p>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendTip}
              disabled={loading || getTipAmount() <= 0 || (balance !== null && getTipAmount() > balance)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {getTipAmount() > 0 ? `${getTipAmount()} SOL` : 'Tip'}
                </>
              )}
            </Button>

            <p className="text-slate-500 text-xs text-center">
              This is a real Solana Devnet transaction. Get free SOL at faucet.solana.com
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TipModal;
