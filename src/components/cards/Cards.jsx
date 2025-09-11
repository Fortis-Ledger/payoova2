import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CreditCard, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Settings,
  Lock,
  Unlock,
  Trash2,
  MapPin,
  Smartphone,
  Globe,
  Shield,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
  Zap,
  Truck,
  Wallet,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

// API functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const cardAPI = {
  async getCards() {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/cards`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch cards');
    return response.json();
  },

  async createCard(cardData) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cardData)
    });
    if (!response.ok) throw new Error('Failed to create card');
    return response.json();
  },

  async updateCard(cardId, updateData) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Failed to update card');
    return response.json();
  },

  async freezeCard(cardId) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}/freeze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to freeze card');
    return response.json();
  },

  async unfreezeCard(cardId) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}/unfreeze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to unfreeze card');
    return response.json();
  },

  async deleteCard(cardId) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to delete card');
    return response.json();
  },

  async loadMoney(cardId, amount) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}/load`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });
    if (!response.ok) throw new Error('Failed to load money');
    return response.json();
  }
};

const Cards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [showDetails, setShowDetails] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [cardType, setCardType] = useState('virtual');
  const [newCard, setNewCard] = useState({
    name: '',
    limit: 1000,
    currency: 'USD',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }
  });

  // Load cards on component mount
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const response = await cardAPI.getCards();
      setCards(response.cards || []);
    } catch (error) {
      console.error('Failed to load cards:', error);
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const toggleCardDetails = (cardId) => {
    setShowDetails(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const formatCardNumber = (number, show = false) => {
    if (!show) return number.replace(/\d(?=\d{4})/g, '*');
    return number;
  };

  const handleCreateCard = async () => {
    if (creating) return;
    
    try {
      setCreating(true);
      const cardData = {
        type: cardType,
        name: newCard.name || `${cardType === 'virtual' ? 'Virtual' : 'Physical'} Card`,
        limit: newCard.limit,
        currency: newCard.currency,
        ...(cardType === 'physical' && { 
          shipping_address: {
            street: newCard.address.street,
            city: newCard.address.city,
            state: newCard.address.state,
            postal_code: newCard.address.zip,
            country: newCard.address.country
          }
        })
      };

      const response = await cardAPI.createCard(cardData);
      
      if (response.success) {
        toast.success(`${cardType === 'virtual' ? 'Virtual' : 'Physical'} card created successfully!`);
        await loadCards(); // Reload cards from server
        setIsCreateDialogOpen(false);
        resetNewCardForm();
      }
    } catch (error) {
      console.error('Failed to create card:', error);
      toast.error('Failed to create card. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const resetNewCardForm = () => {
    setNewCard({
      name: '',
      limit: 1000,
      currency: 'USD',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'US'
      }
    });
  };

  const toggleCardStatus = async (cardId) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    try {
      if (card.status === 'active') {
        await cardAPI.freezeCard(cardId);
        toast.success('Card frozen successfully');
      } else {
        await cardAPI.unfreezeCard(cardId);
        toast.success('Card unfrozen successfully');
      }
      await loadCards(); // Reload cards to get updated status
    } catch (error) {
      console.error('Failed to update card status:', error);
      toast.error('Failed to update card status');
    }
  };

  const deleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return;
    }

    try {
      await cardAPI.deleteCard(cardId);
      toast.success('Card deleted successfully');
      await loadCards(); // Reload cards
    } catch (error) {
      console.error('Failed to delete card:', error);
      toast.error('Failed to delete card');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Active' },
      frozen: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Frozen' },
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending' },
      cancelled: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getShippingBadge = (status) => {
    const shippingConfig = {
      processing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Processing' },
      shipped: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Shipped' },
      delivered: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Delivered' }
    };
    
    const config = shippingConfig[status] || shippingConfig.processing;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">My Cards</h1>
            <p className="text-gray-400">Manage your virtual and physical payment cards</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Card
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Card</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Choose between virtual or physical card and configure your preferences.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Card Type Selection */}
                <Tabs value={cardType} onValueChange={setCardType}>
                  <TabsList className="grid w-full grid-cols-2 bg-white/10">
                    <TabsTrigger value="virtual" className="data-[state=active]:bg-blue-500">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Virtual Card
                    </TabsTrigger>
                    <TabsTrigger value="physical" className="data-[state=active]:bg-purple-500">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Physical Card
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="virtual" className="space-y-4">
                    <Alert className="bg-blue-500/10 border-blue-500/20">
                      <Zap className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-400">
                        Virtual cards are instantly available for online purchases and can be used immediately.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Card Name</Label>
                        <Input
                          placeholder="e.g., Online Shopping Card"
                          value={newCard.name}
                          onChange={(e) => setNewCard(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Spending Limit</Label>
                        <Input
                          type="number"
                          placeholder="1000"
                          value={newCard.limit}
                          onChange={(e) => setNewCard(prev => ({ ...prev, limit: parseFloat(e.target.value) }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="physical" className="space-y-4">
                    <Alert className="bg-purple-500/10 border-purple-500/20">
                      <Truck className="h-4 w-4 text-purple-400" />
                      <AlertDescription className="text-purple-400">
                        Physical cards will be shipped to your address and take 7-10 business days to arrive.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Card Name</Label>
                        <Input
                          placeholder="e.g., Main Physical Card"
                          value={newCard.name}
                          onChange={(e) => setNewCard(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Spending Limit</Label>
                        <Input
                          type="number"
                          placeholder="5000"
                          value={newCard.limit}
                          onChange={(e) => setNewCard(prev => ({ ...prev, limit: parseFloat(e.target.value) }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Shipping Address</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label className="text-white">Street Address</Label>
                          <Input
                            placeholder="123 Main Street"
                            value={newCard.address.street}
                            onChange={(e) => setNewCard(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, street: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">City</Label>
                          <Input
                            placeholder="New York"
                            value={newCard.address.city}
                            onChange={(e) => setNewCard(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, city: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">State/Province</Label>
                          <Input
                            placeholder="NY"
                            value={newCard.address.state}
                            onChange={(e) => setNewCard(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, state: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">ZIP/Postal Code</Label>
                          <Input
                            placeholder="10001"
                            value={newCard.address.zip}
                            onChange={(e) => setNewCard(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, zip: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Country</Label>
                          <select
                            value={newCard.address.country}
                            onChange={(e) => setNewCard(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, country: e.target.value }
                            }))}
                            className="w-full mt-1 p-2 bg-white/10 border border-white/20 rounded-md text-white"
                          >
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="GB">United Kingdom</option>
                            <option value="AU">Australia</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCard}
                    disabled={creating}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      `Create ${cardType === 'virtual' ? 'Virtual' : 'Physical'} Card`
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards Overview */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview">All Cards</TabsTrigger>
            <TabsTrigger value="virtual">Virtual ({cards.filter(c => c.type === 'virtual').length})</TabsTrigger>
            <TabsTrigger value="physical">Physical ({cards.filter(c => c.type === 'physical').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Loading Cards...</h3>
                  <p className="text-gray-400">Please wait while we fetch your cards</p>
                </CardContent>
              </Card>
            ) : cards.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Cards Yet</h3>
                  <p className="text-gray-400 mb-4">Create your first virtual or physical card to get started</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Card
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {cards.map((card) => (
                  <Card key={card.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              card.type === 'virtual' 
                                ? 'bg-blue-500/20' 
                                : 'bg-purple-500/20'
                            }`}>
                              {card.type === 'virtual' ? (
                                <Smartphone className={`w-5 h-5 ${
                                  card.type === 'virtual' ? 'text-blue-400' : 'text-purple-400'
                                }`} />
                              ) : (
                                <CreditCard className={`w-5 h-5 ${
                                  card.type === 'virtual' ? 'text-blue-400' : 'text-purple-400'
                                }`} />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-white">{card.name}</CardTitle>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(card.status)}
                                {card.type === 'physical' && card.shippingStatus && 
                                  getShippingBadge(card.shippingStatus)
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Card Number */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400">Card Number</Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCardDetails(card.id)}
                            className="text-gray-400 hover:text-white h-auto p-1"
                          >
                            {showDetails[card.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-mono">
                            {formatCardNumber(card.cardNumber, showDetails[card.id])}
                          </span>
                          {showDetails[card.id] && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(card.cardNumber)}
                              className="text-gray-400 hover:text-white h-auto p-1"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-400">Expires</Label>
                          <div className="text-white">{card.expiry_date || card.expiryDate}</div>
                        </div>
                        <div>
                          <Label className="text-gray-400">CVV</Label>
                          <div className="text-white font-mono">
                            {showDetails[card.id] ? (card.cvv || '***') : '***'}
                          </div>
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="p-4 bg-white/5 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <Label className="text-gray-400">Available Balance</Label>
                            <div className="text-2xl font-bold text-white">
                              ${parseFloat(card.balance || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <Label className="text-gray-400">Transactions</Label>
                            <div className="text-lg text-white">{card.transaction_count || 0}</div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-4 border-t border-white/10">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCardStatus(card.id)}
                            className={`${
                              card.status === 'active' 
                                ? 'text-red-400 hover:text-red-300' 
                                : 'text-green-400 hover:text-green-300'
                            }`}
                          >
                            {card.status === 'active' ? (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Freeze
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4 mr-2" />
                                Unfreeze
                              </>
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCard(card.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="virtual">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cards.filter(card => card.type === 'virtual').map((card) => (
                <Card key={card.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                  {/* Same card content as above but filtered for virtual cards */}
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <Smartphone className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">{card.name}</h3>
                      <p className="text-gray-400">Virtual Card • Ready for online use</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="physical">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cards.filter(card => card.type === 'physical').map((card) => (
                <Card key={card.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <CreditCard className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">{card.name}</h3>
                      <p className="text-gray-400">Physical Card • {card.shippingStatus || 'Processing'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Cards;
