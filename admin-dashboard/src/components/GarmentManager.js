import React, { useState } from 'react';
import axios from 'axios';

function GarmentManager({ garments, designs, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    base_price: '',
    description: '',
  });
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [selectedDesigns, setSelectedDesigns] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/garments/${editingId}`, formData);
      } else {
        await axios.post('/api/garments', formData);
      }
      setFormData({ name: '', sku: '', base_price: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving garment:', error);
      alert('Error saving garment');
    }
  };

  const handleEdit = (garment) => {
    setFormData({
      name: garment.name,
      sku: garment.sku,
      base_price: garment.base_price,
      description: garment.description,
    });
    setEditingId(garment.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this garment?')) {
      try {
        await axios.delete(`/api/garments/${id}`);
        onUpdate();
      } catch (error) {
        console.error('Error deleting garment:', error);
        alert('Error deleting garment');
      }
    }
  };

  const handleSelectGarment = (garment) => {
    setSelectedGarment(garment);
    setNewColor('');
    setNewSize('');
    setSelectedDesigns(garment.designs ? garment.designs.map(d => d.id) : []);
  };

  const handleAddColor = async () => {
    if (!newColor.trim() || !selectedGarment) return;
    try {
      await axios.post(`/api/garments/${selectedGarment.id}/colors`, {
        name: newColor,
      });
      setNewColor('');
      onUpdate();
      // Re-select to refresh
      const response = await axios.get(`/api/garments/${selectedGarment.id}`);
      setSelectedGarment(response.data);
    } catch (error) {
      console.error('Error adding color:', error);
      alert('Error adding color');
    }
  };

  const handleAddSize = async () => {
    if (!newSize.trim() || !selectedGarment) return;
    try {
      await axios.post(`/api/garments/${selectedGarment.id}/sizes`, {
        size: newSize,
      });
      setNewSize('');
      onUpdate();
      // Re-select to refresh
      const response = await axios.get(`/api/garments/${selectedGarment.id}`);
      setSelectedGarment(response.data);
    } catch (error) {
      console.error('Error adding size:', error);
      alert('Error adding size');
    }
  };

  const handleRemoveColor = async (colorId) => {
    if (window.confirm('Remove this color?')) {
      try {
        await axios.delete(`/api/colors/${colorId}`);
        onUpdate();
        const response = await axios.get(`/api/garments/${selectedGarment.id}`);
        setSelectedGarment(response.data);
      } catch (error) {
        console.error('Error removing color:', error);
      }
    }
  };

  const handleRemoveSize = async (sizeId) => {
    if (window.confirm('Remove this size?')) {
      try {
        await axios.delete(`/api/sizes/${sizeId}`);
        onUpdate();
        const response = await axios.get(`/api/garments/${selectedGarment.id}`);
        setSelectedGarment(response.data);
      } catch (error) {
        console.error('Error removing size:', error);
      }
    }
  };

  const handleToggleDesign = async (designId) => {
    if (!selectedGarment) return;
    try {
      if (selectedDesigns.includes(designId)) {
        // Remove design
        await axios.delete(`/api/garments/${selectedGarment.id}/designs/${designId}`);
        setSelectedDesigns(selectedDesigns.filter(id => id !== designId));
      } else {
        // Add design
        await axios.post(`/api/garments/${selectedGarment.id}/designs/${designId}`, {});
        setSelectedDesigns([...selectedDesigns, designId]);
      }
      onUpdate();
    } catch (error) {
      console.error('Error toggling design:', error);
    }
  };

  return (
    <div className="garment-manager">
      <div className="card">
        <div className="card-header">
          <h2>Garments</h2>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ name: '', sku: '', base_price: '', description: '' });
            }}
          >
            + Add Garment
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label>Garment Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Base Price ($) *</label>
              <input
                type="number"
                name="base_price"
                step="0.01"
                value={formData.base_price}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update' : 'Create'} Garment
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
          {garments.map(garment => (
            <div key={garment.id} className="grid-item">
              <h3>{garment.name}</h3>
              <p><strong>SKU:</strong> {garment.sku}</p>
              <p><strong>Base Price:</strong> ${garment.base_price}</p>
              <div className="grid-item-actions">
                <button 
                  className="btn btn-small btn-secondary"
                  onClick={() => handleSelectGarment(garment)}
                >
                  Manage
                </button>
                <button 
                  className="btn btn-small btn-secondary"
                  onClick={() => handleEdit(garment)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-small btn-danger"
                  onClick={() => handleDelete(garment.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedGarment && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-header">
            <h2>Manage: {selectedGarment.name}</h2>
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => setSelectedGarment(null)}
            >
              Close
            </button>
          </div>

          {/* Colors Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3>Colors</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Add color (e.g., Black, Red)"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddColor()}
              />
              <button className="btn btn-primary btn-small" onClick={handleAddColor}>
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedGarment.colors && selectedGarment.colors.length > 0 ? (
                selectedGarment.colors.map(color => (
                  <div key={color.id} style={{
                    background: '#f0f0f0',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>{color.name}</span>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleRemoveColor(color.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <p>No colors added yet</p>
              )}
            </div>
          </div>

          {/* Sizes Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3>Sizes</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Add size (e.g., Small, Medium)"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSize()}
              />
              <button className="btn btn-primary btn-small" onClick={handleAddSize}>
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedGarment.sizes && selectedGarment.sizes.length > 0 ? (
                selectedGarment.sizes.map(size => (
                  <div key={size.id} style={{
                    background: '#f0f0f0',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>{size.size}</span>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleRemoveSize(size.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <p>No sizes added yet</p>
              )}
            </div>
          </div>

          {/* Designs Section */}
          <div>
            <h3>Available Designs</h3>
            <div className="grid">
              {designs.map(design => (
                <div key={design.id} style={{
                  border: selectedDesigns.includes(design.id) ? '3px solid #667eea' : '1px solid #ddd',
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedDesigns.includes(design.id) ? '#f0f4ff' : 'white'
                }} onClick={() => handleToggleDesign(design.id)}>
                  <img src={design.thumbnail_url || design.image_url} alt={design.name} style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    marginBottom: '0.5rem'
                  }} />
                  <p><strong>{design.name}</strong></p>
                  <p>Price Modifier: ${design.price_modifier}</p>
                  <p>{selectedDesigns.includes(design.id) ? '✓ Selected' : 'Click to add'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GarmentManager;
