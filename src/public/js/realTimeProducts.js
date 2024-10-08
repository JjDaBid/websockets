const socket = io();
const productList = document.getElementById('product-list');
const paginationSection = document.querySelector('.pagination-section');
const productForm = document.getElementById('product-form');
let currentPage = 1;
let currentCategory = '';
let currentMaxPrice = '';
let currentSortOrder = '';

socket.on('productListUpdate', (updatedProducts) => {
  updateProductList(updatedProducts.docs);
  updatePaginationControls(updatedProducts);
});

function updateProductList(products) {
  productList.innerHTML = products.map(product => `
    <div class="product-card">
      <figure class="figure">
        <span class="category-badge">${product.category}</span>
        <img src="${product.image}" alt="Imagen de ${product.title}" class="product-image" />
      </figure>
      <div class="product-info">
        <div class="title-box">
          <p class="product-name">${product.title}</p>
        </div>
        <div class="specific-info">
          <div class="stock-box">
            <p>${product.stock}</p>&nbsp;
            <p>uds en stock</p>
          </div>
          <div class="price-box">
            <p class="product-price">$${product.price}</p>
          </div>
        </div>
      </div>
      <div class="product-actions">
        <button id="edit-button" onclick="loadProductForEdit('${product._id}')" class="button-link">Editar</button>
        <button id="delete-button" onclick="deleteProduct('${product._id}')">Eliminar</button>
        <a id="view-product-button" href="/product/${product._id}" class="button-link">Ver</a>
      </div>
    </div>
  `).join('');
}

function updatePaginationControls(products) {
  if (!paginationSection) return;

  const basePath = currentCategory ? `/realtimeproducts/${currentCategory}/page/` : '/realtimeproducts/page/';

  paginationSection.innerHTML = `
    ${products.hasPrevPage ? `<a id="prev-button" href="${basePath}${products.prevPage}" data-page="${products.prevPage}">Anterior</a>` : ''}
    <input type="number" id="page-input" value="${products.page}" min="1" max="${products.totalPages}" style="width: 50px; text-align: center;" />
    ${products.hasNextPage ? `<a id="next-button" href="${basePath}${products.nextPage}" data-page="${products.nextPage}">Siguiente</a>` : ''}
  `;

  attachPaginationEventListeners(products.totalPages);
}

function attachPaginationEventListeners(totalPages) {
  const prevButton = document.getElementById("prev-button");
  const nextButton = document.getElementById("next-button");
  const pageInput = document.getElementById("page-input");

  if (prevButton) {
    prevButton.addEventListener("click", (e) => handlePaginationClick(e, prevButton.getAttribute('data-page')));
  }

  if (nextButton) {
    nextButton.addEventListener("click", (e) => handlePaginationClick(e, nextButton.getAttribute('data-page')));
  }

  if (pageInput) {
    pageInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        navigateToPage(pageInput.value, totalPages);
      }
    });
  }
}

function handlePaginationClick(e, page) {
  e.preventDefault();
  navigateToPage(page);
}

function navigateToPage(inputPage, totalPages) {
  let page = parseInt(inputPage);
  if (isNaN(page) || page < 1) {
    page = 1;
  } else if (totalPages && page > totalPages) {
    page = totalPages;
  }
  
  currentPage = page;
  requestProductList();
}

function requestProductList() {
  socket.emit('requestProductList', { 
    page: currentPage, 
    category: currentCategory,
    maxPrice: currentMaxPrice,
    sortOrder: currentSortOrder
  });
}

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(productForm);
  const productData = Object.fromEntries(formData.entries());
  const productId = productData.id;

  try {
    let response;
    if (productId) {
      response = await fetch(`/updateProduct/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
    } else {
      response = await fetch('/addProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
    }

    if (response.ok) {
      Toastify({
        text: productId ? "Producto actualizado con éxito" : "Producto creado con éxito",
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
      }).showToast();

      productForm.reset();
      document.getElementById('product-id').value = '';
      requestProductList();
    } else {
      throw new Error('Error en la operación');
    }
  } catch (error) {
    console.error('Error:', error);
    Toastify({
      text: "Error al procesar la operación",
      duration: 3000,
      close: true,
      gravity: "top",
      position: "right",
      backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
    }).showToast();
  }
});

async function loadProductForEdit(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    if (response.ok) {
      const product = await response.json();
      document.getElementById('product-id').value = product._id;
      document.getElementById('product-name').value = product.title;
      document.getElementById('product-description').value = product.description;
      document.getElementById('product-category').value = product.category;
      document.getElementById('product-quantity').value = product.stock;
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-image').value = product.image;
    } else {
      throw new Error('Error al cargar el producto');
    }
  } catch (error) {
    console.error('Error:', error);
    Toastify({
      text: "Error al cargar el producto para editar",
      duration: 3000,
      close: true,
      gravity: "top",
      position: "right",
      backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
    }).showToast();
  }
}

async function deleteProduct(productId) {
  if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
    try {
      const response = await fetch(`/deleteProduct/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        Toastify({
          text: "Producto eliminado con éxito",
          duration: 3000,
          close: true,
          gravity: "top",
          position: "right",
          backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
        }).showToast();

        requestProductList();
      } else {
        throw new Error('Error al eliminar el producto');
      }
    } catch (error) {
      console.error('Error:', error);
      Toastify({
        text: "Error al eliminar el producto",
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      }).showToast();
    }
  }
}

function applyFilters() {
  currentCategory = document.getElementById('filter-category').value;
  currentMaxPrice = document.getElementById('filter-price').value;
  currentSortOrder = document.getElementById('sort-order').value;  
  currentPage = 1;
  requestProductList();
}

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const pathParts = path.split('/');
  currentPage = parseInt(pathParts[pathParts.length - 1]) || 1;
  currentCategory = pathParts[1] !== 'realtimeproducts' && pathParts[1] !== 'page' ? pathParts[1] : '';

  document.getElementById('filter-category').addEventListener('change', applyFilters);
  document.getElementById('filter-price').addEventListener('input', applyFilters);
  document.getElementById('sort-order').addEventListener('change', applyFilters);

  requestProductList();
});
