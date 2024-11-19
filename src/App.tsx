import { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { db } from './firebase';
import {
  Box,
  Typography,
  Collapse,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

// Définition des types pour les cadeaux et les listes
interface Gift {
  id: string;
  name: string;
  price?: string;
  url?: string;
  image?: string;
  purchased?: boolean;
}

interface List {
  id: string;
  name: string;
  gifts: Gift[];
}

function App() {
  const [lists, setLists] = useState<List[]>([]);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newGift, setNewGift] = useState<Gift>({
    id: '',
    name: '',
    price: '',
    url: '',
    image: '',
    purchased: false,
  });
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);

 useEffect(() => {
  const loadLists = async () => {
    const snapshot = await get(ref(db, 'lists'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const listsArray: List[] = Object.entries(data).map(([id, list]: [string, any]) => ({
        id,
        name: list.name,
        gifts: list.gifts
          ? Object.entries(list.gifts).map(([giftId, gift]) => {
              const typedGift = gift as Gift; // Type assertion
              return {
                ...typedGift, // Use the spread first
                id: giftId,   // Override the `id` explicitly
              };
            })
          : [],
      }));
      setLists(listsArray);
    }
  };
  loadLists();
}, []);


  const handleToggleExpand = (listId: string) => {
    setExpandedListId(expandedListId === listId ? null : listId);
  };

  const handleCreateList = async () => {
    const listId = uuidv4();
    const newList: List = { id: listId, name: newListName, gifts: [] };
    await set(ref(db, `lists/${listId}`), newList);
    setLists([...lists, newList]);
    setNewListName('');
    setDialogOpen(false);
  };

  const handleAddGift = async (listId: string) => {
    const giftId = uuidv4();
    const newGiftData: Gift = { ...newGift, id: giftId, purchased: false };
    await set(ref(db, `lists/${listId}/gifts/${giftId}`), newGiftData);
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId
          ? { ...list, gifts: [...list.gifts, newGiftData] }
          : list
      )
    );
    setNewGift({ id: '', name: '', price: '', url: '', image: '', purchased: false });
    setGiftDialogOpen(false);
  };

  const handlePurchaseToggle = async (listId: string, gift: Gift) => {
    const updatedGift: Gift = { ...gift, purchased: !gift.purchased };
    await set(ref(db, `lists/${listId}/gifts/${gift.id}`), updatedGift);
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              gifts: list.gifts.map((g) => (g.id === gift.id ? updatedGift : g)),
            }
          : list
      )
    );
  };

  const handleDeleteGift = async (listId: string, giftId: string) => {
    await remove(ref(db, `lists/${listId}/gifts/${giftId}`));
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              gifts: list.gifts.filter((gift) => gift.id !== giftId),
            }
          : list
      )
    );
  };


  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Typography variant="h3" sx={{ mb: 4, color: '#f44336', textAlign: 'center' }}>
        Ma Liste de Noël
      </Typography>

      {/* Bouton pour créer une nouvelle liste */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Ajouter une liste
        </Button>
      </Box>

      {/* Liste des listes */}
      <List>
        {lists.map((list) => (
          <Box key={list.id} sx={{ mb: 2 }}>
            <ListItem
              sx={{
                background: 'linear-gradient(to right, #f5f5f5, #e0e0e0)',
                borderRadius: 2,
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                px: 2,
              }}
              button
              onClick={() => handleToggleExpand(list.id)}
            >
              <ListItemText
                primary={list.name}
                sx={{ fontWeight: 'bold', textAlign: 'center', color: '#333' }}
              />
              <IconButton>
                {expandedListId === list.id ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </ListItem>

            {/* Cadeaux de la liste */}
            <Collapse in={expandedListId === list.id} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 1, p: 2, border: '1px solid #ddd', borderRadius: 2, background: '#fff' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Cadeaux demandés
                </Typography>
                {list.gifts.length > 0 ? (
                  list.gifts.map((gift) => (
                    <Box
                      key={gift.id}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: '1px solid #ccc',
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {gift.name || 'Cadeau sans nom'}
                      </Typography>
                      <Typography variant="body2">
                        Prix estimé : {gift.price ? `${gift.price} €` : 'Non défini'}
                      </Typography>
                      {gift.url && (
                        <Typography variant="body2">
                          Lien :{' '}
                          <a href={gift.url} target="_blank" rel="noopener noreferrer">
                            {gift.url}
                          </a>
                        </Typography>
                      )}
                      {gift.image && (
                        <Box sx={{ mt: 1 }}>
                          <img src={gift.image} alt="Cadeau" style={{ maxWidth: '100%' }} />
                        </Box>
                      )}
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color={gift.purchased ? 'success' : 'primary'}
                          onClick={() => handlePurchaseToggle(list.id, gift)}
                        >
                          {gift.purchased ? 'Acheté ✅' : 'Acheter'}
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDeleteGift(list.id, gift.id)}
                        >
                          Supprimer
                        </Button>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2">Aucun cadeau pour cette liste.</Typography>
                )}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setGiftDialogOpen(true);
                      setExpandedListId(list.id);
                    }}
                  >
                    Ajouter un cadeau
                  </Button>
                </Box>
              </Box>
            </Collapse>
          </Box>
        ))}
      </List>

      {/* Dialog pour créer une nouvelle liste */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Créer une nouvelle liste</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom de la liste"
            fullWidth
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleCreateList} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour ajouter un cadeau */}
      <Dialog open={giftDialogOpen} onClose={() => setGiftDialogOpen(false)}>
        <DialogTitle>Ajouter un cadeau</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du cadeau"
            fullWidth
            value={newGift.name}
            onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Prix estimé (€)"
            fullWidth
            type="number"
            value={newGift.price}
            onChange={(e) => setNewGift({ ...newGift, price: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Lien URL"
            fullWidth
            value={newGift.url}
            onChange={(e) => setNewGift({ ...newGift, url: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Lien de l'image"
            fullWidth
            value={newGift.image}
            onChange={(e) => setNewGift({ ...newGift, image: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGiftDialogOpen(false)}>Annuler</Button>
          <Button onClick={() => handleAddGift(expandedListId!)} variant="contained">
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
