import { useState, useEffect } from 'react';
import { ref, set, get, remove, update } from 'firebase/database';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface Gift {
  id: string;
  name: string;
  price?: string;
  url?: string;
  image?: string;
  purchased?: boolean;
  purchaser?: string;
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
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newGift, setNewGift] = useState<Gift>({
    id: '',
    name: '',
    price: '',
    url: '',
    image: '',
    purchased: false,
  });

  useEffect(() => {
    const loadLists = async () => {
      const snapshot = await get(ref(db, 'lists'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const listsArray: List[] = Object.entries(data).map(([id, list]: [string, any]) => ({
          id,
          name: list.name,
          gifts: list.gifts
            ? Object.entries(list.gifts).map(([giftId, gift]) => ({
                id: giftId,
                ...(gift as Gift),
              }))
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
    const newList = { id: listId, name: newListName, gifts: [] };
    await set(ref(db, `lists/${listId}`), newList);
    setLists([...lists, newList]);
    setNewListName('');
    setDialogOpen(false);
  };

  const handleDeleteList = async (listId: string) => {
    await remove(ref(db, `lists/${listId}`));
    setLists(lists.filter((list) => list.id !== listId));
  };

  const handleAddOrEditGift = async (listId: string) => {
    if (editingGift) {
      await update(ref(db, `lists/${listId}/gifts/${editingGift.id}`), editingGift);
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                gifts: list.gifts.map((gift) =>
                  gift.id === editingGift.id ? editingGift : gift
                ),
              }
            : list
        )
      );
    } else {
      const giftId = uuidv4();
      const newGiftData = { ...newGift, id: giftId, purchased: false };
      await set(ref(db, `lists/${listId}/gifts/${giftId}`), newGiftData);
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId
            ? { ...list, gifts: [...list.gifts, newGiftData] }
            : list
        )
      );
    }
    setEditingGift(null);
    setNewGift({ id: '', name: '', price: '', url: '', image: '', purchased: false });
    setGiftDialogOpen(false);
  };

  const handleDeleteGift = async (listId: string, giftId: string) => {
    await remove(ref(db, `lists/${listId}/gifts/${giftId}`));
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId
          ? { ...list, gifts: list.gifts.filter((gift) => gift.id !== giftId) }
          : list
      )
    );
  };

  const handlePurchaseToggle = async (listId: string, gift: Gift) => {
    const purchaserName = gift.purchased
      ? ''
      : prompt('Entrez le nom de l’acheteur :');
    const updatedGift = {
      ...gift,
      purchased: !gift.purchased,
      purchaser: purchaserName,
    };
    await update(ref(db, `lists/${listId}/gifts/${gift.id}`), updatedGift);
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



   return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h3" sx={{ mb: 4, color: '#f44336' }}>
        Ma Liste de Noël
      </Typography>

      <Button
        variant="contained"
        onClick={() => setDialogOpen(true)}
        sx={{ mb: 4 }}
      >
        Ajouter une liste
      </Button>

      <List>
        {lists.map((list) => (
          <Accordion
            key={list.id}
            expanded={expandedListId === list.id}
            onChange={() => handleToggleExpand(list.id)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ backgroundColor: '#f0f0f0' }}
            >
              <Typography>{list.name}</Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteList(list.id);
                }}
                sx={{ ml: 2 }}
              >
                Supprimer la liste
              </Button>
            </AccordionSummary>

            <AccordionDetails>
              <Typography variant="h6">Cadeaux demandés :</Typography>
              <List>
                {list.gifts.map((gift) => (
                  <ListItem key={gift.id} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">{gift.name}</Typography>
                      <Typography variant="body2">
                        {gift.price ? `Prix: ${gift.price} €` : ''}
                      </Typography>
                      {gift.url && (
                        <Typography variant="body2">
                          <a href={gift.url} target="_blank" rel="noopener noreferrer">
                            Lien vers le cadeau
                          </a>
                        </Typography>
                      )}
                      {gift.image && (
                        <img src={gift.image} alt={gift.name} style={{ maxWidth: '100px' }} />
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditingGift(gift);
                        setGiftDialogOpen(true);
                      }}
                      sx={{ mr: 1 }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="contained"
                      color={gift.purchased ? 'success' : 'primary'}
                      onClick={() =>
                        handlePurchaseToggle(list.id, gift)
                      }
                    >
                      {gift.purchased
                        ? `Acheté par : ${gift.purchaser || 'inconnu'}`
                        : 'Acheter'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteGift(list.id, gift.id)}
                      sx={{ ml: 1 }}
                    >
                      Supprimer
                    </Button>
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                onClick={() => {
                  setEditingGift(null);
                  setGiftDialogOpen(true);
                }}
                sx={{ mt: 2 }}
              >
                Ajouter un cadeau
              </Button>
            </AccordionDetails>
          </Accordion>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Ajouter une nouvelle liste</DialogTitle>
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
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={giftDialogOpen} onClose={() => setGiftDialogOpen(false)}>
        <DialogTitle>{editingGift ? 'Modifier le cadeau' : 'Ajouter un cadeau'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du cadeau"
            fullWidth
            value={editingGift?.name || newGift.name}
            onChange={(e) =>
              editingGift
                ? setEditingGift({ ...editingGift, name: e.target.value })
                : setNewGift({ ...newGift, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Prix estimé (€)"
            type="number"
            fullWidth
            value={editingGift?.price || newGift.price}
            onChange={(e) =>
              editingGift
                ? setEditingGift({ ...editingGift, price: e.target.value })
                : setNewGift({ ...newGift, price: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="URL"
            type="url"
            fullWidth
            value={editingGift?.url || newGift.url}
            onChange={(e) =>
              editingGift
                ? setEditingGift({ ...editingGift, url: e.target.value })
                : setNewGift({ ...newGift, url: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Image (URL)"
            type="url"
            fullWidth
            value={editingGift?.image || newGift.image}
            onChange={(e) =>
              editingGift
                ? setEditingGift({ ...editingGift, image: e.target.value })
                : setNewGift({ ...newGift, image: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGiftDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={() => {
              const targetListId = lists.find((list) =>
                list.gifts.some((gift) => gift.id === editingGift?.id)
              )?.id;
              handleAddOrEditGift(targetListId || lists[0].id);
            }}
            variant="contained"
          >
            {editingGift ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
