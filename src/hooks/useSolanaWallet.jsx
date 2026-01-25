import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  TransactionInstruction
} from '@solana/web3.js';
import { useState, useCallback, useEffect } from 'react';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export const useSolanaWallet = () => {
  const { connection } = useConnection();
  const { 
    publicKey, 
    connected, 
    connecting, 
    disconnect, 
    sendTransaction,
    signMessage,
    wallet 
  } = useWallet();
  
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [safetyPoints, setSafetyPoints] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [onChainReports, setOnChainReports] = useState([]);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      setBalance(null);
      return;
    }
    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    }
  }, [publicKey, connection]);

  const fetchTransactionHistory = useCallback(async () => {
    if (!publicKey || !connection) return;
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
      setTransactionHistory(signatures.map(sig => ({
        signature: sig.signature,
        slot: sig.slot,
        timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
        status: sig.confirmationStatus,
        error: sig.err
      })));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
      fetchTransactionHistory();
      const savedPoints = localStorage.getItem('pathly_points_' + publicKey.toString());
      if (savedPoints) setSafetyPoints(parseInt(savedPoints, 10));
      const savedReports = localStorage.getItem('pathly_reports_' + publicKey.toString());
      if (savedReports) setOnChainReports(JSON.parse(savedReports));
    } else {
      setBalance(null);
      setSafetyPoints(0);
      setTransactionHistory([]);
      setOnChainReports([]);
    }
  }, [connected, publicKey, fetchBalance, fetchTransactionHistory]);

  const requestAirdrop = useCallback(async (amount = 1) => {
    if (!publicKey || !connection) throw new Error('Wallet not connected');
    setLoading(true);
    try {
      const signature = await connection.requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, 'confirmed');
      await fetchBalance();
      return { success: true, signature, amount, explorerUrl: 'https://explorer.solana.com/tx/' + signature + '?cluster=devnet' };
    } catch (error) {
      console.error('Airdrop failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, fetchBalance]);

  const recordSafetyReportOnChain = useCallback(async (reportData) => {
    if (!publicKey || !connection || !sendTransaction) throw new Error('Wallet not connected');
    setLoading(true);
    try {
      const memoData = JSON.stringify({ type: 'PATHLY_SAFETY_REPORT', version: '1.0', timestamp: Date.now(), reporter: publicKey.toString(), ...reportData });
      const memoInstruction = new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoData, 'utf-8')
      });
      const transaction = new Transaction().add(memoInstruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      const pointsEarned = reportData.points || 25;
      const newPoints = safetyPoints + pointsEarned;
      setSafetyPoints(newPoints);
      localStorage.setItem('pathly_points_' + publicKey.toString(), newPoints.toString());
      const newReport = { signature, ...reportData, timestamp: Date.now() };
      const updatedReports = [...onChainReports, newReport];
      setOnChainReports(updatedReports);
      localStorage.setItem('pathly_reports_' + publicKey.toString(), JSON.stringify(updatedReports));
      await fetchBalance();
      await fetchTransactionHistory();
      return { success: true, signature, pointsEarned, totalPoints: newPoints, explorerUrl: 'https://explorer.solana.com/tx/' + signature + '?cluster=devnet' };
    } catch (error) {
      console.error('Error recording safety report:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, sendTransaction, safetyPoints, onChainReports, fetchBalance, fetchTransactionHistory]);

  const sendTip = useCallback(async (recipientAddress, amountSol, message = '') => {
    if (!publicKey || !connection || !sendTransaction) throw new Error('Wallet not connected');
    setLoading(true);
    try {
      const recipientPubkey = new PublicKey(recipientAddress);
      const lamports = amountSol * LAMPORTS_PER_SOL;
      const transferInstruction = SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: recipientPubkey, lamports });
      const transaction = new Transaction().add(transferInstruction);
      if (message) {
        const memoInstruction = new TransactionInstruction({
          keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(JSON.stringify({ type: 'PATHLY_TIP', message, timestamp: Date.now() }), 'utf-8')
        });
        transaction.add(memoInstruction);
      }
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      await fetchBalance();
      await fetchTransactionHistory();
      return { success: true, signature, amount: amountSol, recipient: recipientAddress, explorerUrl: 'https://explorer.solana.com/tx/' + signature + '?cluster=devnet' };
    } catch (error) {
      console.error('Error sending tip:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalance, fetchTransactionHistory]);

  const generateTipLink = useCallback((amountSol = 0.01, label = 'Pathly Safety Tip') => {
    if (!publicKey) return null;
    return 'solana:' + publicKey.toString() + '?amount=' + amountSol + '&label=' + encodeURIComponent(label) + '&message=' + encodeURIComponent('Thanks for keeping routes safe!');
  }, [publicKey]);

  const signSafetyPledge = useCallback(async () => {
    if (!publicKey || !signMessage) throw new Error('Wallet does not support message signing');
    const message = 'I pledge to contribute accurate safety information to the Pathly community.\n\nWallet: ' + publicKey.toString() + '\nTimestamp: ' + new Date().toISOString() + '\n\n#PathlySafetyNetwork';
    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);
      return { message, signature: Buffer.from(signature).toString('base64'), publicKey: publicKey.toString() };
    } catch (error) {
      console.error('Error signing pledge:', error);
      throw error;
    }
  }, [publicKey, signMessage]);

  const claimRewards = useCallback(async () => {
    if (!publicKey || !connected) throw new Error('Wallet not connected');
    if (safetyPoints < 100) throw new Error('Need at least 100 points to claim rewards');
    setLoading(true);
    try {
      const rewardSol = Math.floor(safetyPoints / 100) * 0.001;
      const remainingPoints = safetyPoints % 100;
      setSafetyPoints(remainingPoints);
      localStorage.setItem('pathly_points_' + publicKey.toString(), remainingPoints.toString());
      return { success: true, amount: rewardSol, message: 'Claimed ' + rewardSol + ' SOL!' };
    } catch (error) {
      console.error('Error claiming rewards:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected, safetyPoints]);

  const getExplorerUrl = useCallback(() => {
    if (!publicKey) return null;
    return 'https://explorer.solana.com/address/' + publicKey.toString() + '?cluster=devnet';
  }, [publicKey]);

  return {
    publicKey, connected, connecting, disconnect, walletName: wallet?.adapter?.name,
    balance, fetchBalance, transactionHistory, fetchTransactionHistory,
    requestAirdrop, safetyPoints, onChainReports, recordSafetyReportOnChain,
    sendTip, generateTipLink, claimRewards, signSafetyPledge, getExplorerUrl, loading
  };
};

export default useSolanaWallet;
