// Supabase Card Context for Payoova Wallet
// This handles card management and card transactions using Supabase

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, TABLES, ENUMS } from '../config/supabase-config';
import { useAuth } from './SupabaseAuthContext';
import { useKYC } from './SupabaseKYCContext';

// Create Card Context
const CardContext = createContext({});

// Custom hook to use card context
export const useCard = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('useCard must be used within a CardProvider');
  }
  return context;
};

// Card Provider Component
export const CardProvider = ({ children }) => {
  const { profile, isAuthenticated, isAdmin } = useAuth();
  const { kycStatus, isKYCRequired } = useKYC();
  
  // State
  const [cards, setCards] = useState([]);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cardLimits, setCardLimits] = useState({});
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);

  // Initialize card data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && profile) {
      initializeCardData();
      setupRealtimeSubscription();
    } else {
      clearCardData();
    }

    return () => {
      if (realtimeSubscription) {
        realtimeSubscription();
      }
    };
  }, [isAuthenticated, profile]);

  // Initialize card data
  const initializeCardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserCards(),
        loadCardTransactions(),
        loadCardLimits()
      ]);
    } catch (error) {
      console.error('Error initializing card data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  const setupRealtimeSubscription = () => {
    if (!profile) return;

    const unsubscribe = supabaseHelpers.subscribeToCardData(
      profile.id,
      (type, payload) => {
        console.log('Real-time card update:', type, payload);
        
        switch (type) {
          case 'card':
            handleCardUpdate(payload);
            break;
          case 'card_transaction':
            handleCardTransactionUpdate(payload);
            break;
          default:
            break;
        }
      }
    );

    setRealtimeSubscription(() => unsubscribe);
  };

  // Handle real-time card updates
  const handleCardUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setCards(prevCards => {
      switch (eventType) {
        case 'INSERT':
          return [...prevCards, newRecord];
        case 'UPDATE':
          return prevCards.map(card => 
            card.id === newRecord.id ? newRecord : card
          );
        case 'DELETE':
          return prevCards.filter(card => card.id !== oldRecord.id);
        default:
          return prevCards;
      }
    });
  };

  // Handle real-time card transaction updates
  const handleCardTransactionUpdate = (payload) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      setCardTransactions(prevTransactions => [newRecord, ...prevTransactions]);
      
      // Update card balance if transaction is completed
      if (newRecord.status === ENUMS.CARD_TRANSACTION_STATUS.COMPLETED) {
        updateCardBalance(newRecord.card_id, newRecord.amount, newRecord.transaction_type);
      }
    }
  };

  // Load user cards
  const loadUserCards = async () => {
    try {
      if (!profile) return;

      const { data, error } = await supabase
        .from(TABLES.CARDS)
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCards(data);
      
      // Set primary card as selected if none selected
      if (!selectedCard && data.length > 0) {
        const primaryCard = data.find(c => c.is_primary) || data[0];
        setSelectedCard(primaryCard);
      }
      
      // Cache cards locally
      localStorage.setItem('userCards', JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Error loading user cards:', error);
      throw error;
    }
  };

  // Load card transactions
  const loadCardTransactions = async (cardId = null, limit = 50, offset = 0) => {
    try {
      if (!profile) return;

      let query = supabase
        .from(TABLES.CARD_TRANSACTIONS)
        .select(`
          *,
          card:${TABLES.CARDS}(card_number_masked, card_type)
        `);

      if (cardId) {
        query = query.eq('card_id', cardId);
      } else {
        // Get transactions for all user's cards
        const userCardIds = cards.map(card => card.id);
        if (userCardIds.length > 0) {
          query = query.in('card_id', userCardIds);
        } else {
          return [];
        }
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      if (offset === 0) {
        setCardTransactions(data);
      } else {
        setCardTransactions(prev => [...prev, ...data]);
      }
      
      // Cache recent transactions locally
      if (offset === 0) {
        localStorage.setItem('cardTransactions', JSON.stringify(data));
      }
      
      return data;
    } catch (error) {
      console.error('Error loading card transactions:', error);
      throw error;
    }
  };

  // Load card limits
  const loadCardLimits = async () => {
    try {
      if (!profile) return;

      // Get user's card limits based on KYC status and account type
      const limits = {
        daily_spend: kycStatus === ENUMS.KYC_STATUS.APPROVED ? 10000 : 1000,
        monthly_spend: kycStatus === ENUMS.KYC_STATUS.APPROVED ? 50000 : 5000,
        atm_daily: kycStatus === ENUMS.KYC_STATUS.APPROVED ? 2000 : 500,
        online_daily: kycStatus === ENUMS.KYC_STATUS.APPROVED ? 5000 : 1000,
        max_cards: kycStatus === ENUMS.KYC_STATUS.APPROVED ? 5 : 2
      };

      setCardLimits(limits);
      return limits;
    } catch (error) {
      console.error('Error loading card limits:', error);
      throw error;
    }
  };

  // Create new card
  const createCard = async (cardType, walletId, cardName = null) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      // Check KYC requirement for card creation
      if (isKYCRequired('CREATE_CARD')) {
        throw new Error('KYC verification required to create cards');
      }

      // Check card limits
      if (cards.length >= cardLimits.max_cards) {
        throw new Error(`Maximum ${cardLimits.max_cards} cards allowed`);
      }

      setLoading(true);

      // Generate card details using database function
      const { data: cardDetails, error: cardError } = await supabase
        .rpc('generate_card_details', {
          p_user_id: profile.id,
          p_card_type: cardType
        });

      if (cardError) {
        throw cardError;
      }

      // Check if this should be the primary card
      const isPrimary = cards.length === 0;

      const cardData = {
        user_id: profile.id,
        wallet_id: walletId,
        card_type: cardType,
        card_number: cardDetails.card_number,
        card_number_masked: cardDetails.card_number_masked,
        expiry_month: cardDetails.expiry_month,
        expiry_year: cardDetails.expiry_year,
        cvv: cardDetails.cvv,
        cardholder_name: profile.full_name || profile.email,
        card_name: cardName || `${cardType} Card`,
        status: ENUMS.CARD_STATUS.ACTIVE,
        is_primary: isPrimary,
        is_active: true,
        balance: 0,
        daily_limit: cardLimits.daily_spend,
        monthly_limit: cardLimits.monthly_spend,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.CARDS)
        .insert([cardData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setCards(prev => [...prev, data]);
      
      if (isPrimary) {
        setSelectedCard(data);
      }

      Alert.alert('Success', 'Card created successfully!');
      return data;
    } catch (error) {
      console.error('Error creating card:', error);
      Alert.alert('Error', error.message || 'Failed to create card');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Load money to card
  const loadMoneyToCard = async (cardId, amount, sourceWalletId) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      setLoading(true);

      // Validate inputs
      if (!cardId || !amount || parseFloat(amount) <= 0) {
        throw new Error('Invalid load parameters');
      }

      // Get card details
      const card = cards.find(c => c.id === cardId);
      if (!card) {
        throw new Error('Card not found');
      }

      // Create card transaction record
      const transactionData = {
        card_id: cardId,
        user_id: profile.id,
        transaction_type: ENUMS.CARD_TRANSACTION_TYPE.LOAD,
        amount: parseFloat(amount),
        currency: 'USD', // Default currency
        status: ENUMS.CARD_TRANSACTION_STATUS.PENDING,
        source_wallet_id: sourceWalletId,
        description: `Load money to ${card.card_name}`,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.CARD_TRANSACTIONS)
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // In production, this would integrate with card provider API
      // For now, simulate successful load
      setTimeout(async () => {
        await updateCardTransactionStatus(
          data.id, 
          ENUMS.CARD_TRANSACTION_STATUS.COMPLETED,
          { processed_at: new Date().toISOString() }
        );
      }, 2000);

      Alert.alert('Success', 'Money loaded to card successfully!');
      return data;
    } catch (error) {
      console.error('Error loading money to card:', error);
      Alert.alert('Error', error.message || 'Failed to load money to card');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Process card payment
  const processCardPayment = async (cardId, amount, merchantInfo) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      // Get card details
      const card = cards.find(c => c.id === cardId);
      if (!card) {
        throw new Error('Card not found');
      }

      // Check card status
      if (card.status !== ENUMS.CARD_STATUS.ACTIVE) {
        throw new Error('Card is not active');
      }

      // Check balance
      if (card.balance < parseFloat(amount)) {
        throw new Error('Insufficient card balance');
      }

      // Check daily limit
      const todaySpent = await getTodayCardSpending(cardId);
      if (todaySpent + parseFloat(amount) > card.daily_limit) {
        throw new Error('Daily spending limit exceeded');
      }

      // Create card transaction record
      const transactionData = {
        card_id: cardId,
        user_id: profile.id,
        transaction_type: ENUMS.CARD_TRANSACTION_TYPE.PURCHASE,
        amount: parseFloat(amount),
        currency: merchantInfo.currency || 'USD',
        status: ENUMS.CARD_TRANSACTION_STATUS.PENDING,
        merchant_name: merchantInfo.name,
        merchant_category: merchantInfo.category,
        merchant_location: merchantInfo.location,
        description: `Payment to ${merchantInfo.name}`,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.CARD_TRANSACTIONS)
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // In production, this would process with card network
      // For now, simulate successful payment
      setTimeout(async () => {
        await updateCardTransactionStatus(
          data.id, 
          ENUMS.CARD_TRANSACTION_STATUS.COMPLETED,
          { 
            processed_at: new Date().toISOString(),
            authorization_code: `AUTH${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          }
        );
      }, 3000);

      return data;
    } catch (error) {
      console.error('Error processing card payment:', error);
      throw error;
    }
  };

  // Update card transaction status
  const updateCardTransactionStatus = async (transactionId, status, additionalData = {}) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CARD_TRANSACTIONS)
        .update({
          status,
          ...additionalData
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating card transaction status:', error);
      throw error;
    }
  };

  // Update card balance
  const updateCardBalance = async (cardId, amount, transactionType) => {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      let newBalance = card.balance;
      
      if (transactionType === ENUMS.CARD_TRANSACTION_TYPE.LOAD) {
        newBalance += parseFloat(amount);
      } else if (transactionType === ENUMS.CARD_TRANSACTION_TYPE.PURCHASE) {
        newBalance -= parseFloat(amount);
      }

      const { data, error } = await supabase
        .from(TABLES.CARDS)
        .update({ balance: newBalance })
        .eq('id', cardId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, balance: newBalance } : c
      ));

      return data;
    } catch (error) {
      console.error('Error updating card balance:', error);
      throw error;
    }
  };

  // Get today's card spending
  const getTodayCardSpending = async (cardId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from(TABLES.CARD_TRANSACTIONS)
        .select('amount')
        .eq('card_id', cardId)
        .eq('transaction_type', ENUMS.CARD_TRANSACTION_TYPE.PURCHASE)
        .eq('status', ENUMS.CARD_TRANSACTION_STATUS.COMPLETED)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (error) {
        throw error;
      }

      return data.reduce((total, tx) => total + parseFloat(tx.amount), 0);
    } catch (error) {
      console.error('Error getting today card spending:', error);
      return 0;
    }
  };

  // Freeze/unfreeze card
  const toggleCardFreeze = async (cardId, freeze = true) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      setLoading(true);

      const newStatus = freeze ? ENUMS.CARD_STATUS.FROZEN : ENUMS.CARD_STATUS.ACTIVE;

      const { data, error } = await supabase
        .from(TABLES.CARDS)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId)
        .eq('user_id', profile.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      Alert.alert(
        'Success', 
        `Card ${freeze ? 'frozen' : 'unfrozen'} successfully!`
      );
      return data;
    } catch (error) {
      console.error('Error toggling card freeze:', error);
      Alert.alert('Error', 'Failed to update card status');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Set primary card
  const setPrimaryCard = async (cardId) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      // Update all cards to not primary
      await supabase
        .from(TABLES.CARDS)
        .update({ is_primary: false })
        .eq('user_id', profile.id);

      // Set selected card as primary
      const { data, error } = await supabase
        .from(TABLES.CARDS)
        .update({ is_primary: true })
        .eq('id', cardId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setCards(prev => prev.map(card => ({
        ...card,
        is_primary: card.id === cardId
      })));

      setSelectedCard(data);
      return data;
    } catch (error) {
      console.error('Error setting primary card:', error);
      throw error;
    }
  };

  // Delete card
  const deleteCard = async (cardId) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      setLoading(true);

      // Check if card has balance
      const card = cards.find(c => c.id === cardId);
      if (card && card.balance > 0) {
        throw new Error('Cannot delete card with remaining balance');
      }

      // Soft delete by setting is_active to false
      const { data, error } = await supabase
        .from(TABLES.CARDS)
        .update({ 
          is_active: false,
          status: ENUMS.CARD_STATUS.CANCELLED,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId)
        .eq('user_id', profile.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setCards(prev => prev.filter(c => c.id !== cardId));
      
      if (selectedCard?.id === cardId) {
        const remainingCards = cards.filter(c => c.id !== cardId);
        setSelectedCard(remainingCards.length > 0 ? remainingCards[0] : null);
      }

      Alert.alert('Success', 'Card deleted successfully!');
      return data;
    } catch (error) {
      console.error('Error deleting card:', error);
      Alert.alert('Error', error.message || 'Failed to delete card');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear card data
  const clearCardData = () => {
    setCards([]);
    setCardTransactions([]);
    setSelectedCard(null);
    setCardLimits({});
    
    if (realtimeSubscription) {
      realtimeSubscription();
      setRealtimeSubscription(null);
    }
  };

  // Get card by ID
  const getCardById = (cardId) => {
    return cards.find(card => card.id === cardId);
  };

  // Get transactions for specific card
  const getCardTransactions = (cardId) => {
    return cardTransactions.filter(tx => tx.card_id === cardId);
  };

  // Calculate total card balance
  const getTotalCardBalance = () => {
    return cards.reduce((total, card) => total + parseFloat(card.balance || 0), 0);
  };

  // Get card spending analytics
  const getCardSpendingAnalytics = (cardId, period = 'month') => {
    const transactions = getCardTransactions(cardId)
      .filter(tx => tx.transaction_type === ENUMS.CARD_TRANSACTION_TYPE.PURCHASE)
      .filter(tx => tx.status === ENUMS.CARD_TRANSACTION_STATUS.COMPLETED);

    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodTransactions = transactions.filter(tx => 
      new Date(tx.created_at) >= startDate
    );

    return {
      totalSpent: periodTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0),
      transactionCount: periodTransactions.length,
      averageTransaction: periodTransactions.length > 0 
        ? periodTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / periodTransactions.length 
        : 0,
      topMerchants: periodTransactions.reduce((acc, tx) => {
        const merchant = tx.merchant_name || 'Unknown';
        acc[merchant] = (acc[merchant] || 0) + parseFloat(tx.amount);
        return acc;
      }, {})
    };
  };

  // Context value
  const value = {
    // State
    cards,
    cardTransactions,
    selectedCard,
    loading,
    cardLimits,
    
    // Card management methods
    createCard,
    deleteCard,
    setPrimaryCard,
    toggleCardFreeze,
    loadUserCards,
    
    // Transaction methods
    loadMoneyToCard,
    processCardPayment,
    loadCardTransactions,
    updateCardTransactionStatus,
    
    // Utility methods
    getCardById,
    getCardTransactions,
    getTotalCardBalance,
    getCardSpendingAnalytics,
    getTodayCardSpending,
    setSelectedCard,
    
    // Data refresh
    initializeCardData,
  };

  return (
    <CardContext.Provider value={value}>
      {children}
    </CardContext.Provider>
  );
};

export default CardContext;