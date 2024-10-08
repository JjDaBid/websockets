const socket = io();

let currentPage = 1;
let currentCategory = '';
let currentMaxPrice = '';
let currentSortOrder = '';

socket.on('productListUpdate', (updatedProducts) => {
  updateProductList(updatedProducts.docs);
  updatePaginationControls(updatedProducts);
});

function updateProductList(products) {
  const productList = document.getElementById('product-list');
  if (!productList) return;

  productList.innerHTML = products.map(product => `
    <div class="product-card" data-id="${product._id}">
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
    </div>
  `).join('');
}

function updatePaginationControls(products) {
  const paginationSection = document.querySelector('.pagination-section');
  if (!paginationSection) return;

  const basePath = currentCategory ? `/${currentCategory}/page/` : '/page/';

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
    prevButton.addEventListener("click", handlePaginationClick);
  }

  if (nextButton) {
    nextButton.addEventListener("click", handlePaginationClick);
  }

  if (pageInput) {
    pageInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        navigateToPage(pageInput.value, totalPages);
      }
    });

    pageInput.addEventListener("change", (e) => {
      let page = parseInt(e.target.value);
      if (page > totalPages) {
        page = totalPages;
      } else if (page < 1) {
        page = 1;
      }
      e.target.value = page;
    });
  }
}

function navigateToPage(inputPage, totalPages) {
  let page = parseInt(inputPage);
  if (isNaN(page) || page < 1) {
    page = 1;
  } else if (page > totalPages) {
    page = totalPages;
  }
  
  currentPage = page;
  requestProductList();
}

function handlePaginationClick(e) {
  e.preventDefault();
  const page = this.getAttribute('data-page');
  if (page) {
    navigateToPage(page, null);
  }
}

function applyFilters() {
  currentCategory = document.getElementById('filter-category').value;
  currentMaxPrice = document.getElementById('filter-price').value;
  currentSortOrder = document.getElementById('sort-order').value;  
  currentPage = 1;
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

document.addEventListener('DOMContentLoaded', () => {
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
