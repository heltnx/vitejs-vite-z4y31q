import React, { useState } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase';

interface GiftProps {
  gift: {
    id: string;
    name?: string;
    url?: string;
    imageUrl?: string;
    price?: number;
    reserved?: string;
    purchased?: boolean;
  };
  listId: string;
  onDelete: (giftId: string) => void;
}

export const Gift: React.FC<GiftProps> = ({ gift, listId, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGift, setEditedGift] = useState(gift);

  const handleUpdate = async () => {
    if (!editedGift.name && !editedGift.url && !editedGift.imageUrl) {
      alert('Please fill in at least one field: name, URL, or image URL');
      return;
    }

    const updates = {
      [`/lists/${listId}/gifts/${gift.id}`]: {
        ...editedGift,
        price: editedGift.price || null,
      }
    };

    try {
      await update(ref(db), updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating gift:', error);
      alert('Failed to update gift');
    }
  };

  const handleStatusUpdate = async (status: 'reserved' | 'purchased', value: any) => {
    const updates = {
      [`/lists/${listId}/gifts/${gift.id}/${status}`]: value
    };
    await update(ref(db), updates);
  };

  return (
    <div className={`gift-item ${gift.purchased ? 'purchased' : ''}`}>
      {isEditing ? (
        <div className="gift-edit-form">
          <input
            type="text"
            value={editedGift.name || ''}
            onChange={(e) => setEditedGift({ ...editedGift, name: e.target.value })}
            placeholder="Gift name"
          />
          <input
            type="text"
            value={editedGift.url || ''}
            onChange={(e) => setEditedGift({ ...editedGift, url: e.target.value })}
            placeholder="Product URL"
          />
          <input
            type="text"
            value={editedGift.imageUrl || ''}
            onChange={(e) => setEditedGift({ ...editedGift, imageUrl: e.target.value })}
            placeholder="Image URL"
          />
          <input
            type="number"
            value={editedGift.price || ''}
            onChange={(e) => setEditedGift({ ...editedGift, price: parseFloat(e.target.value) || null })}
            placeholder="Price (optional)"
          />
          <button onClick={handleUpdate}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="gift-display">
          {gift.name && <h3>{gift.name}</h3>}
          {gift.imageUrl && (
            <img src={gift.imageUrl} alt={gift.name || 'Gift'} className="gift-image" />
          )}
          {gift.url && (
            <a href={gift.url} target="_blank" rel="noopener noreferrer">
              View Product
            </a>
          )}
          {gift.price && <p>Price: {gift.price}€</p>}
          
          <div className="gift-actions">
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button onClick={() => onDelete(gift.id)}>Delete</button>
            
            {!gift.purchased && (
              <>
                <button
                  onClick={() => handleStatusUpdate('reserved', gift.reserved ? null : 'RESERVED')}
                  className={gift.reserved ? 'active' : ''}
                >
                  {gift.reserved ? 'Cancel Reservation' : 'Reserve'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('purchased', !gift.purchased)}
                  className={gift.purchased ? 'active' : ''}
                >
                  Mark as {gift.purchased ? 'Not Purchased' : 'Purchased'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};