import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import GarmentManager from './components/GarmentManager';
import DesignManager from './components/DesignManager';

function App() {
  const [activeTab, setActiveTab] = useState('garments');
  const [garments, setGarments] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGarments();
    fetchDesigns();
  }, []);

  const fetchGarments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/garments');
      setGarments(response.data);
    } catch (error) {
      console.error('Error fetching garments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesigns = async () => {
    try {
      const response = await axios.get('/api/designs');
      setDesigns(response.data);
    } catch (error) {
      console.error('Error fetching designs:', error);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Garment Customizer Admin</h1>
        <p>Manage garments, designs, colors, and sizes</p>
      </header>

      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'garments' ? 'active' : ''}`}
          onClick={() => setActiveTab('garments')}
        >
          Garments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'designs' ? 'active' : ''}`}
          onClick={() => setActiveTab('designs')}
        >
          Designs
        </button>
      </nav>

      <main className="app-content">
        {loading && <div className="loading">Loading...</div>}
        
        {activeTab === 'garments' && (
          <GarmentManager 
            garments={garments} 
            designs={designs}
            onUpdate={fetchGarments}
          />
        )}
        
        {activeTab === 'designs' && (
          <DesignManager 
            designs={designs}
            onUpdate={fetchDesigns}
          />
        )}
      </main>
    </div>
  );
}

export default App;
