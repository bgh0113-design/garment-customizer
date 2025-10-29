/**
 * Garment Customizer Component
 * This component is embedded on your Shopify product page
 * It handles the front design customization for customers
 */

class GarmentCustomizer {
  constructor(config) {
    this.apiUrl = config.apiUrl || 'http://localhost:5000/api';
    this.garmentId = config.garmentId;
    this.containerId = config.containerId;
    this.garmentData = null;
    this.selectedDesign = null;
    this.selectedColor = null;
    this.selectedSize = null;
    this.basePrice = 0;

    this.init();
  }

  async init() {
    try {
      // Fetch garment data
      const response = await fetch(`${this.apiUrl}/garments/${this.garmentId}`);
      this.garmentData = await response.json();
      this.basePrice = parseFloat(this.garmentData.base_price);
      
      // Render the customizer
      this.render();
    } catch (error) {
      console.error('Error initializing customizer:', error);
      this.renderError();
    }
  }

  render() {
    const container = document.getElementById(this.containerId);
    container.innerHTML = `
      <div class="gc-customizer">
        <div class="gc-preview-section">
          <div class="gc-garment-preview">
            <img id="gc-garment-image" src="" alt="Garment Preview" class="gc-garment-base">
            <canvas id="gc-design-preview" class="gc-design-overlay"></canvas>
            <div class="gc-selected-design-label" id="gc-selected-design-label"></div>
          </div>
        </div>

        <div class="gc-options-section">
          <!-- Designs Section -->
          <div class="gc-option-group">
            <h3>Select Design (Front)</h3>
            <div class="gc-designs-grid" id="gc-designs-grid">
              ${this.renderDesigns()}
            </div>
          </div>

          <!-- Color Section -->
          <div class="gc-option-group">
            <h3>Select Color</h3>
            <div class="gc-colors-grid" id="gc-colors-grid">
              ${this.renderColors()}
            </div>
          </div>

          <!-- Size Section -->
          <div class="gc-option-group">
            <h3>Select Size</h3>
            <div class="gc-sizes-grid" id="gc-sizes-grid">
              ${this.renderSizes()}
            </div>
          </div>

          <!-- Price Display -->
          <div class="gc-price-section">
            <p class="gc-base-price">Base Price: $${this.basePrice.toFixed(2)}</p>
            <p class="gc-design-surcharge" id="gc-design-surcharge"></p>
            <p class="gc-total-price" id="gc-total-price">Total: $${this.basePrice.toFixed(2)}</p>
          </div>

          <!-- Add to Cart Button -->
          <button id="gc-add-to-cart" class="gc-btn gc-btn-primary" disabled>
            Add to Cart
          </button>
        </div>
      </div>
    `;

    // Add styles
    this.addStyles();

    // Add event listeners
    this.attachEventListeners();
  }

  renderDesigns() {
    if (!this.garmentData.designs || this.garmentData.designs.length === 0) {
      return '<p>No designs available</p>';
    }

    return this.garmentData.designs.map(design => `
      <div class="gc-design-box" data-design-id="${design.id}">
        <img src="${design.thumbnail_url || design.image_url}" alt="${design.name}">
        <p class="gc-design-name">${design.name}</p>
        <p class="gc-design-surcharge-small">${design.price_modifier > 0 ? '+$' + design.price_modifier : 'Included'}</p>
      </div>
    `).join('');
  }

  renderColors() {
    if (!this.garmentData.colors || this.garmentData.colors.length === 0) {
      return '<p>No colors available</p>';
    }

    return this.garmentData.colors.map(color => `
      <div class="gc-color-option" data-color-id="${color.id}" title="${color.name}">
        <div class="gc-color-swatch" style="background-color: ${color.hex_code || '#ccc'}"></div>
        <p>${color.name}</p>
      </div>
    `).join('');
  }

  renderSizes() {
    if (!this.garmentData.sizes || this.garmentData.sizes.length === 0) {
      return '<p>No sizes available</p>';
    }

    return this.garmentData.sizes.map(size => `
      <button class="gc-size-btn" data-size-id="${size.id}">
        ${size.size}
      </button>
    `).join('');
  }

  attachEventListeners() {
    // Design selection
    document.querySelectorAll('.gc-design-box').forEach(box => {
      box.addEventListener('click', (e) => this.selectDesign(e.currentTarget));
    });

    // Color selection
    document.querySelectorAll('.gc-color-option').forEach(option => {
      option.addEventListener('click', (e) => {
        document.querySelectorAll('.gc-color-option').forEach(o => o.classList.remove('gc-selected'));
        e.currentTarget.classList.add('gc-selected');
        this.selectedColor = e.currentTarget.dataset.colorId;
        this.updateAddToCartButton();
      });
    });

    // Size selection
    document.querySelectorAll('.gc-size-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.gc-size-btn').forEach(b => b.classList.remove('gc-selected'));
        e.currentTarget.classList.add('gc-selected');
        this.selectedSize = e.currentTarget.dataset.sizeId;
        this.updateAddToCartButton();
      });
    });

    // Add to cart button
    document.getElementById('gc-add-to-cart').addEventListener('click', () => this.addToCart());
  }

  selectDesign(element) {
    document.querySelectorAll('.gc-design-box').forEach(box => {
      box.classList.remove('gc-selected');
    });
    element.classList.add('gc-selected');

    const designId = element.dataset.designId;
    const design = this.garmentData.designs.find(d => d.id == designId);
    this.selectedDesign = design;

    // Update preview
    this.updateDesignPreview(design);

    // Update price
    this.updatePrice();

    // Update label
    const label = document.getElementById('gc-selected-design-label');
    label.textContent = design.name;
    label.style.display = 'block';

    this.updateAddToCartButton();
  }

  updateDesignPreview(design) {
    const canvas = document.getElementById('gc-design-preview');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 400;
      ctx.drawImage(img, 0, 0, 300, 400);
    };
    img.crossOrigin = 'Anonymous';
    img.src = design.image_url;
  }

  updatePrice() {
    const designSurcharge = this.selectedDesign ? parseFloat(this.selectedDesign.price_modifier) : 0;
    const total = this.basePrice + designSurcharge;

    const surchargeEl = document.getElementById('gc-design-surcharge');
    if (designSurcharge > 0) {
      surchargeEl.textContent = `Design Surcharge: +$${designSurcharge.toFixed(2)}`;
      surchargeEl.style.display = 'block';
    } else {
      surchargeEl.style.display = 'none';
    }

    document.getElementById('gc-total-price').textContent = `Total: $${total.toFixed(2)}`;
  }

  updateAddToCartButton() {
    const button = document.getElementById('gc-add-to-cart');
    const isReady = this.selectedDesign && this.selectedColor && this.selectedSize;
    button.disabled = !isReady;
    button.textContent = isReady ? 'Add to Cart' : 'Select All Options';
  }

  async addToCart() {
    try {
      // Create customization record
      const designSurcharge = parseFloat(this.selectedDesign.price_modifier);
      const totalPrice = this.basePrice + designSurcharge;

      const customizationResponse = await fetch(`${this.apiUrl}/customizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garment_id: this.garmentId,
          design_id: this.selectedDesign.id,
          selected_color_id: this.selectedColor,
          selected_size_id: this.selectedSize,
          total_price: totalPrice,
          customization_data: {
            design_name: this.selectedDesign.name,
            design_thumbnail: this.selectedDesign.thumbnail_url || this.selectedDesign.image_url,
            color_name: this.garmentData.colors.find(c => c.id == this.selectedColor)?.name,
            size_name: this.garmentData.sizes.find(s => s.id == this.selectedSize)?.size,
          }
        })
      });

      const customization = await customizationResponse.json();

      // Prepare line item properties for Shopify
      const lineItemProperties = {
        'Customization ID': customization.id,
        'Design': this.selectedDesign.name,
        'Design Thumbnail': this.selectedDesign.thumbnail_url || this.selectedDesign.image_url,
        'Color': this.garmentData.colors.find(c => c.id == this.selectedColor)?.name,
        'Size': this.garmentData.sizes.find(s => s.id == this.selectedSize)?.size,
      };

      // Add to Shopify cart
      const addToCartData = {
        id: this.garmentData.id, // Shopify variant ID
        quantity: 1,
        properties: lineItemProperties
      };

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addToCartData)
      });

      if (response.ok) {
        alert('Item added to cart!');
        // Optionally redirect to cart or trigger cart drawer
      } else {
        alert('Error adding to cart. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding to cart');
    }
  }

  addStyles() {
    if (document.getElementById('gc-styles')) return; // Already added

    const styles = `
      <style id="gc-styles">
        .gc-customizer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          max-width: 1200px;
          margin: 2rem auto;
          font-family: inherit;
        }

        .gc-preview-section {
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .gc-garment-preview {
          position: relative;
          width: 300px;
          height: 400px;
          background: #f9f9f9;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .gc-garment-base {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gc-design-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .gc-selected-design-label {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.9rem;
          display: none;
        }

        .gc-options-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .gc-option-group {
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .gc-option-group h3 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          color: #333;
        }

        .gc-designs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .gc-design-box {
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .gc-design-box:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
        }

        .gc-design-box.gc-selected {
          border-color: #667eea;
          border-width: 3px;
          background-color: #f0f4ff;
        }

        .gc-design-box img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .gc-design-name {
          margin: 0.5rem 0 0.25rem 0;
          font-weight: 500;
          color: #333;
          font-size: 0.95rem;
        }

        .gc-design-surcharge-small {
          margin: 0;
          color: #666;
          font-size: 0.85rem;
        }

        .gc-colors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 1rem;
        }

        .gc-color-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .gc-color-option:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
        }

        .gc-color-option.gc-selected {
          border-color: #667eea;
          background-color: #f0f4ff;
        }

        .gc-color-swatch {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1px solid #ddd;
        }

        .gc-color-option p {
          margin: 0;
          font-size: 0.85rem;
          text-align: center;
          color: #333;
        }

        .gc-sizes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem;
        }

        .gc-size-btn {
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .gc-size-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .gc-size-btn.gc-selected {
          background-color: #667eea;
          color: white;
          border-color: #667eea;
        }

        .gc-price-section {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 6px;
        }

        .gc-price-section p {
          margin: 0.5rem 0;
          font-size: 1rem;
          color: #333;
        }

        .gc-base-price {
          color: #666;
          font-size: 0.95rem;
        }

        .gc-design-surcharge {
          color: #f44336;
          font-size: 0.95rem;
          display: none;
        }

        .gc-total-price {
          font-size: 1.3rem;
          font-weight: bold;
          color: #667eea;
        }

        .gc-btn {
          padding: 1rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .gc-btn-primary {
          background-color: #667eea;
          color: white;
          width: 100%;
        }

        .gc-btn-primary:hover:not(:disabled) {
          background-color: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .gc-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .gc-customizer {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .gc-designs-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  renderError() {
    const container = document.getElementById(this.containerId);
    container.innerHTML = '<p style="color: red;">Error loading customizer. Please refresh the page.</p>';
  }
}

// Export for global use
window.GarmentCustomizer = GarmentCustomizer;
