const socket = io();

const productList = document.getElementById('product-list');
const paginationSection = document.querySelector('.pagination-section');
let currentPage = 1;
let currentCategory = '';
let currentMaxPrice = '';
let currentSortOrder = '';

socket.on('productListUpdate', (updatedProducts) => {
  updateProductList(updatedProducts.docs);
  updatePaginationControls(updatedProducts);
});

function updateProductList(products) {
  if (!productList) return;

  productList.innerHTML = '';

  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.setAttribute('data-id', product._id);
    productCard.innerHTML = `
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
    `;
    productList.appendChild(productCard);
  });

  if (products.length === 0) {
    const noProductsMessage = document.createElement('p');
    noProductsMessage.textContent = 'No hay productos disponibles';
    productList.appendChild(noProductsMessage);
  }
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
  socket.emit('requestFilteredProducts', { 
    page: currentPage, 
    category: currentCategory,
    maxPrice: currentMaxPrice,
    sortOrder: currentSortOrder
  });
}

function applyFilters() {
  currentCategory = document.getElementById('filter-category').value;
  currentMaxPrice = document.getElementById('filter-price').value;
  currentSortOrder = document.getElementById('sort-order').value;  
  currentPage = 1;
  updateCategoryText();
  requestProductList();
}

function updateCategoryText() {
  const category = document.getElementById('filter-category').value || 'Todas';
  if (category === "Todas") {
    document.getElementById('categoryText').textContent = `Sensualidad que abraza tu cuerpo, elegancia que define tu esencia.`;
  } else {
    document.getElementById('categoryText').textContent = `${category}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const pathParts = path.split('/');
  currentPage = parseInt(pathParts[pathParts.length - 1]) || 1;
  currentCategory = pathParts[1] !== 'realtimeproducts' && pathParts[1] !== 'page' ? pathParts[1] : '';
  const productList = document.getElementById('product-list');

  if (productList) {
    productList.addEventListener("click", (event) => {
      const card = event.target.closest('.product-card');
      if (card) {
        const productId = card.getAttribute('data-id');
        window.location.href = `/product/${productId}`;
      }
    });
  }

  document.getElementById('filter-category').addEventListener('change', applyFilters);
  document.getElementById('filter-price').addEventListener('input', applyFilters);
  document.getElementById('sort-order').addEventListener('change', applyFilters);

  requestProductList();
});
