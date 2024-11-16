import React, { useState, useEffect } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from './firebase';
import { GiftList } from './components/GiftList';
import { v4 as uuidv4 } from 'uuid';
import {
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
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

function App() {
  const [lists, setLists] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    // Check URL for list parameter
    const params = new URLSearchParams(window.location.search);
    const listId = params.get('list');
    if (listId) {
      setSelectedList(listId);
    }

    // Load lists from Firebase
    const loadLists = async () => {
      const snapshot = await get(ref(db, 'lists'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const listsArray = Object.entries(data).map(([id, list]: [string, any]) => ({
          id,
          name: list.name,
        }));
        setLists(listsArray);
      }
    };

    loadLists();
  }, []);

  const handleCreateList = () => {
    if (!newListName) return;

    const listId = uuidv4();
    const newList = {
      id: listId,
      name: newListName,
      gifts: [],
    };

    set(ref(db, `lists/${listId}`), newList);
    setLists([...lists, { id: listId, name: newListName }]);
    setNewListName('');
    setDialogOpen(false);
    setSelectedList(listId);
  };

  const handleDeleteList = (listId: string) => {
    set(ref(db, `lists/${listId}`), null);
    setLists(lists.filter(l => l.id !== listId));
    if (selectedList === listId) {
      setSelectedList(null);
    }
  };

  if (selectedList) {
    return (
      <Box>
        <Button
          onClick={() => setSelectedList(null)}
          sx={{ m: 2 }}
        >
          ← Retour aux listes
        </Button>
        <GiftList listId={selectedList} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h3" sx={{ mb: 4, color: '#f44336' }}>
        Ma Liste de Noël
      </Typography>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Mes Listes
      </Typography>

      <List>
        {lists.map((list) => (
          <ListItem
            key={list.id}
            button
            onClick={() => setSelectedList(list.id)}
          >
            <ListItemText primary={`Liste de ${list.name}`} />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteList(list.id);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Button
        startIcon={<AddIcon />}
        variant="contained"
        onClick={() => setDialogOpen(true)}
        sx={{ mt: 2 }}
      >
        Créer une nouvelle liste
      </Button>

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
    </Box>
  );
}

export default App;