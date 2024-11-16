import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebase';
import { List, Gift } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardMedia,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';

export const GiftList: React.FC<{ listId: string }> = ({ listId }) => {
  const [list, setList] = useState<List | null>(null);
  const [newGift, setNewGift] = useState<Partial<Gift>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);

  useEffect(() => {
    const listRef = ref(db, `lists/${listId}`);
    const unsubscribe = onValue(listRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setList(data);
      }
    });

    return () => unsubscribe();
  }, [listId]);

  const validateGift = (gift: Partial<Gift>) => {
    return gift.name || gift.url || gift.imageUrl;
  };

  const handleAddGift = () => {
    if (!validateGift(newGift)) {
      alert('Veuillez remplir au moins un champ (nom, URL ou image)');
      return;
    }

    const gift: Gift = {
      id: uuidv4(),
      ...newGift,
    };

    const updatedGifts = [...(list?.gifts || []), gift];
    const updates = {
      ...list,
      gifts: updatedGifts,
    };
    
    set(ref(db, `lists/${listId}`), updates);
    setNewGift({});
    setDialogOpen(false);
  };

  const handleEditGift = () => {
    if (!editingGift || !list || !validateGift(editingGift)) return;

    const updatedGifts = list.gifts.map(g => 
      g.id === editingGift.id ? editingGift : g
    );
    const updates = {
      ...list,
      gifts: updatedGifts,
    };
    set(ref(db, `lists/${listId}`), updates);
    setEditingGift(null);
  };

  const handleDeleteGift = (giftId: string) => {
    if (!list) return;
    const updatedGifts = list.gifts.filter(g => g.id !== giftId);
    const updates = {
      ...list,
      gifts: updatedGifts,
    };
    set(ref(db, `lists/${listId}`), updates);
  };

  const handleReserveGift = (gift: Gift, name: string) => {
    if (!list) return;
    const updatedGifts = list.gifts.map(g => 
      g.id === gift.id ? { ...g, reservedBy: name } : g
    );
    const updates = {
      ...list,
      gifts: updatedGifts,
    };
    set(ref(db, `lists/${listId}`), updates);
  };

  const handleMarkPurchased = (gift: Gift) => {
    if (!list) return;
    const updatedGifts = list.gifts.map(g => 
      g.id === gift.id ? { ...g, purchased: true } : g
    );
    const updates = {
      ...list,
      gifts: updatedGifts,
    };
    set(ref(db, `lists/${listId}`), updates);
  };

  const handleShare = () => {
    const url = `${window.location.origin}?list=${listId}`;
    navigator.clipboard.writeText(url);
    alert('Lien copié dans le presse-papier !');
  };

  const GiftDialog = ({ gift, onSave, onClose }: { 
    gift: Partial<Gift>, 
    onSave: () => void, 
    onClose: () => void 
  }) => (
    <Dialog open onClose={onClose} fullWidth>
      <DialogTitle>
        {gift.id ? 'Modifier le cadeau' : 'Ajouter un cadeau'}
      </DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Nom du cadeau"
          fullWidth
          value={gift.name || ''}
          onChange={(e) => gift.id 
            ? setEditingGift({ ...editingGift!, name: e.target.value })
            : setNewGift({ ...newGift, name: e.target.value })
          }
        />
        <TextField
          margin="dense"
          label="Prix estimé (€)"
          type="number"
          fullWidth
          value={gift.price || ''}
          onChange={(e) => {
            const value = e.target.value ? Number(e.target.value) : undefined;
            gift.id 
              ? setEditingGift({ ...editingGift!, price: value })
              : setNewGift({ ...newGift, price: value });
          }}
        />
        <TextField
          margin="dense"
          label="URL du produit"
          fullWidth
          value={gift.url || ''}
          onChange={(e) => gift.id 
            ? setEditingGift({ ...editingGift!, url: e.target.value || undefined })
            : setNewGift({ ...newGift, url: e.target.value || undefined })
          }
        />
        <TextField
          margin="dense"
          label="URL de l'image"
          fullWidth
          value={gift.imageUrl || ''}
          onChange={(e) => gift.id 
            ? setEditingGift({ ...editingGift!, imageUrl: e.target.value || undefined })
            : setNewGift({ ...newGift, imageUrl: e.target.value || undefined })
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onSave} variant="contained">
          {gift.id ? 'Modifier' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (!list) return <Typography>Chargement...</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Liste de {list.name}</Typography>
        <Button
          startIcon={<ShareIcon />}
          variant="contained"
          onClick={handleShare}
        >
          Partager
        </Button>
      </Box>

      {list.gifts?.map((gift) => (
        <Card 
          key={gift.id} 
          sx={{ 
            mb: 2,
            opacity: gift.purchased ? 0.6 : 1,
            transition: 'opacity 0.3s'
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                {gift.name && (
                  <Typography variant="h6">{gift.name}</Typography>
                )}
                {gift.imageUrl && (
                  <CardMedia
                    component="img"
                    image={gift.imageUrl}
                    alt={gift.name || "Image du cadeau"}
                    sx={{ 
                      height: 200, 
                      width: 'auto', 
                      objectFit: 'contain',
                      mt: 1 
                    }}
                  />
                )}
                {gift.price && (
                  <Typography color="text.secondary">
                    Prix estimé: {gift.price}€
                  </Typography>
                )}
                {gift.url && (
                  <Button href={gift.url} target="_blank">
                    Voir le produit
                  </Button>
                )}
                {gift.reservedBy && (
                  <Typography color="primary">
                    Réservé par: {gift.reservedBy}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <IconButton
                  color="primary"
                  onClick={() => setEditingGift(gift)}
                >
                  <EditIcon />
                </IconButton>
                {!gift.reservedBy && !gift.purchased && (
                  <IconButton
                    color="primary"
                    onClick={() => {
                      const name = prompt('Votre nom:');
                      if (name) handleReserveGift(gift, name);
                    }}
                  >
                    <ShoppingCartIcon />
                  </IconButton>
                )}
                {gift.reservedBy && !gift.purchased && (
                  <IconButton
                    color="success"
                    onClick={() => handleMarkPurchased(gift)}
                  >
                    <CheckIcon />
                  </IconButton>
                )}
                <IconButton
                  color="error"
                  onClick={() => handleDeleteGift(gift.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}

      <Button
        startIcon={<AddIcon />}
        variant="contained"
        onClick={() => setDialogOpen(true)}
        sx={{ mt: 2 }}
      >
        Ajouter un cadeau
      </Button>

      {dialogOpen && (
        <GiftDialog
          gift={newGift}
          onSave={handleAddGift}
          onClose={() => setDialogOpen(false)}
        />
      )}

      {editingGift && (
        <GiftDialog
          gift={editingGift}
          onSave={handleEditGift}
          onClose={() => setEditingGift(null)}
        />
      )}
    </Box>
  );
};