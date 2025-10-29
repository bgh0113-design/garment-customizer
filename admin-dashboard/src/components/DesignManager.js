import React, { useState } from 'react';
import axios from 'axios';

function DesignManager({ designs, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    thumbnail_url: '',
    price_modifier: 0,
    is_active: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/designs/${editingId}`, formData);
      } else {
        await axios.post('/api/designs', formData);
      }
      setFormData({
        name: '',
        image_url: '',
        thumbnail_url: '',
        price_modifier: 0,
        is_active: true
      });
      setEditingId(null);
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Error saving design');
    }
  };

  const handleEdit = (design) => {
    setFormData({
      name: design.name,
      image_url: design.image_url,
      thumbnail_url: design.thumbnail_url,
      price_modifier: design.price_modifier,
      is_active: design.is_active
    });
    setEditingId(design.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this design?')) {
      try {
        await axios.delete(`/api/designs/${id}`);
        onUpdate();
      } catch (error) {
        console.error('Error deleting design:', error);
        alert('Error deleting design');
      }
    }
  };

  return (
    <div className="design-manager">
      <div className="card">
        <div className="card-header">
          <h2>Designs</h2>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                name: '',
                image_url: '',
                thumbnail_url: '',
                price_modifier: 0,
                is_active: true
              });
            }}
          >
            + Add Design
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="form" style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Design Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Cape Hook Logo"
                required
              />
            </div>

            <div className="form-group">
              <label>Image URL *</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://example.com/design.png"
                required
              />
              <small>This is the full-size design image</small>
            </div>

            <div className="form-group">
              <label>Thumbnail URL</label>
              <input
                type="url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleInputChange}
                placeholder="https://example.com/design-thumb.png"
              />
              <small>If left empty, will use the image URL</small>
            </div>

            <div className="form-group">
              <label>Price Modifier ($)</label>
              <input
                type="number"
                name="price_modifier"
                step="0.01"
                value={formData.price_modifier}
                onChange={handleInputChange}
              />
              <small>Additional cost for this design (can be 0)</small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                {' '}Active (show in customer view)
              </label>
            </div>

            {formData.image_url && (
              <div className="form-group">
                <label>Preview</label>
                <img 
                  src={formData.image_url} 
                  alt="preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '4px',
                    marginTop: '0.5rem'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update' : 'Create'} Design
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid">
          {designs.map(design => (
            <div key={design.id} className="grid-item">
              <img 
                src={design.thumbnail_url || design.image_url} 
                alt={design.name}
              />
              <h3>{design.name}</h3>
              <p><strong>Price Modifier:</strong> ${design.price_modifier}</p>
              <p><strong>Status:</strong> {design.is_active ? '✓ Active' : '✗ Inactive'}</p>
              <div className="grid-item-actions">
                <button 
                  className="btn btn-small btn-secondary"
                  onClick={() => handleEdit(design)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-small btn-danger"
                  onClick={() => handleDelete(design.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DesignManager;
