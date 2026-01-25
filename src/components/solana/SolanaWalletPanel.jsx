import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Award, 
  Gift, 
  TrendingUp, 
  Shield, 
  Star,
  ChevronDown,
  ChevronUp,
  Coins,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  History,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

/**
 * Solana Wallet Panel Component
 * 
 * Displays wallet connection status, balance, safety points,
 * and rewards for contributing to the Pathly safety network.
 * 
 * Uses REAL Solana Devnet transactions!
 */
export const SolanaWalletPanel = ({ className = "" }) => {
  const { connected } = useWallet();
  const {
    balance,
    safetyPoints,
    claimRewards,
    loading,
    walletName,
    publicKey,
    requestAirdrop,
    transactionHistory,
    fetchTransactionHistory,
    getExplorerUrl
  } = useSolanaWallet();
  
  const [expanded, setExpanded] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null);
  const [airdropLoading, setAirdropLoading] = useState(false);
  const { toast } = useToast();

  const handleClaimRewards = async () => {
    try {
      const result = await claimRewards();
      setClaimStatus('success');
      toast({
        title: "Rewards Claimed! 🎉",
        description: `You received ${result.amount} SOL! View on Solana Explorer.`,
      });
      setTimeout(() => setClaimStatus(null), 3000);
    } catch (error) {
      setClaimStatus('error');
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive"
      });
      setTimeout(() => setClaimStatus(null), 3000);
    }
  };

  const handleAirdrop = async () => {
    setAirdropLoading(true);
    try {
      const result = await requestAirdrop(1);
      toast({
        title: "Airdrop Successful! 💰",
        description: `Received ${result.amount} SOL on Devnet`,
      });
    } catch (error) {
      toast({
        title: "Airdrop Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAirdropLoading(false);
    }
  };

  const rewardTiers = [
    { points: 100, reward: '0.01 SOL', icon: Star, unlocked: safetyPoints >= 100 },
    { points: 500, reward: '0.05 SOL', icon: Shield, unlocked: safetyPoints >= 500 },
    { points: 1000, reward: '0.1 SOL + NFT Badge', icon: Award, unlocked: safetyPoints >= 1000 },
  ];

  const nextTier = rewardTiers.find(t => !t.unlocked) || rewardTiers[rewardTiers.length - 1];
  const progress = Math.min((safetyPoints / nextTier.points) * 100, 100);

  // Compact view when not connected
  if (!connected) {
    return (
      <Card className={`bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-500/30 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Connect Wallet</p>
                <p className="text-xs text-gray-400">Earn SOL for safety reports</p>
              </div>
            </div>
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !h-9 !text-sm" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-500/30 overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                {walletName || 'Wallet'}
                <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400">
                  Devnet
                </Badge>
              </CardTitle>
              <p className="text-xs text-gray-400 font-mono">
                {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-white"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance & Points Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Balance</p>
            <p className="text-lg font-bold text-white">
              {balance !== null ? `${balance.toFixed(4)} SOL` : '---'}
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Safety Points</p>
            <p className="text-lg font-bold text-purple-400 flex items-center gap-1">
              <Coins className="w-4 h-4" />
              {safetyPoints}
            </p>
          </div>
        </div>

        {/* Progress to Next Reward */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Progress to {nextTier.reward}</span>
            <span className="text-purple-400">{safetyPoints}/{nextTier.points}</span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-black/20 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-400">12</p>
            <p className="text-[10px] text-gray-400">Reports</p>
          </div>
          <div className="bg-black/20 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-400">3</p>
            <p className="text-[10px] text-gray-400">Verified</p>
          </div>
          <div className="bg-black/20 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-yellow-400">2</p>
            <p className="text-[10px] text-gray-400">Badges</p>
          </div>
        </div>

        {/* Earn More Section */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-white">Earn More SOL</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-green-400" /> Safety Report
              </span>
              <span className="text-green-400">+25 pts</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400" /> Verify Report
              </span>
              <span className="text-yellow-400">+5 pts</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleClaimRewards}
            disabled={loading || safetyPoints < 100}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="sm"
          >
            {claimStatus === 'success' ? (
              <><CheckCircle className="w-4 h-4 mr-1" /> Claimed!</>
            ) : claimStatus === 'error' ? (
              <><AlertCircle className="w-4 h-4 mr-1" /> Failed</>
            ) : (
              <><Gift className="w-4 h-4 mr-1" /> Claim Rewards</>
            )}
          </Button>
          
          <Button
            onClick={handleAirdrop}
            disabled={airdropLoading}
            variant="outline"
            size="sm"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
          >
            <Zap className="w-4 h-4 mr-1" />
            {airdropLoading ? 'Requesting...' : 'Airdrop'}
          </Button>
        </div>

        {/* Expanded View */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-purple-500/30 text-purple-300"
                  onClick={() => window.open(getExplorerUrl(), '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Explorer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-purple-500/30 text-purple-300"
                  onClick={fetchTransactionHistory}
                >
                  <History className="w-3 h-3 mr-1" />
                  History
                </Button>
              </div>

              {/* Reward Tiers */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">Reward Tiers</p>
                {rewardTiers.map((tier, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      tier.unlocked 
                        ? 'bg-purple-500/20 border border-purple-500/30' 
                        : 'bg-black/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <tier.icon className={`w-4 h-4 ${tier.unlocked ? 'text-purple-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${tier.unlocked ? 'text-white' : 'text-gray-500'}`}>
                        {tier.points} points
                      </span>
                    </div>
                    <Badge 
                      variant={tier.unlocked ? "default" : "outline"}
                      className={tier.unlocked ? "bg-purple-500" : "border-gray-600 text-gray-500"}
                    >
                      {tier.reward}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Recent Transactions */}
              {transactionHistory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Recent Transactions</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {transactionHistory.slice(0, 5).map((tx, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-black/20 rounded text-xs"
                      >
                        <span className="text-gray-400 font-mono">
                          {tx.signature?.slice(0, 8)}...
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {tx.type || 'Transaction'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* How to Earn */}
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">How to Earn Points</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Shield className="w-3 h-3 text-green-400" />
                    <span>Report safety concerns (+25 pts)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                    <span>Rate route safety (+10 pts)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span>Verify others' reports (+5 pts)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default SolanaWalletPanel;
