const socket = io();
const productList = document.getElementById('product-list');
const paginationSection = document.querySelector('.pagination-section');

socket.on('productListUpdate', (updatedProducts) => {
  updateProductList(updatedProducts.docs);
  updatePaginationControls(updatedProducts);
});

function updateProductList(products){
  if (productList) {
    productList.innerHTML = products.map(product => `
       <div class="product-card" data-id="${product._id}">
          <figure class="figure">
              <span class="category-badge">${product.category}</span>
              <img
                  src="${product.image}"
                  alt="Imagen de ${product.title}"
                  class="product-image"
              />
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
                      <p class="product-price">$${product.price.toLocaleString()}</p>
                  </div>
              </div>
          </div>
      </div>

    `).join('');
  }
}

function updatePaginationControls(products) {
  if (!paginationSection) return;

  paginationSection.innerHTML = `
      ${products.hasPrevPage ? `<a id="prev-button" href="/realTimeProducts/page/${products.prevPage}" data-page="${products.prevPage}">Anterior</a>` : ''}
      <input type="number" id="page-input" value="${products.page}" min="1" max="${products.totalPages}" style="width: 50px; text-align: center;" />
      ${products.hasNextPage ? `<a id="next-button" href="/realTimeProducts/page/${products.nextPage}" data-page="${products.nextPage}">Siguiente</a>` : ''}
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
        let page = parseInt(pageInput.value);        
        if (page > totalPages) {
          page = totalPages;
        } else if (page < 1) {
          page = 1;
        }  
        socket.emit('requestProductList', page);
        window.history.pushState({}, '', `/realTimeProducts/page/${page}`);
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

function handlePaginationClick(e) {
  e.preventDefault();
  const page = this.getAttribute('data-page');
  if (page) {
      socket.emit('requestProductList', parseInt(page));
      window.history.pushState({}, '', `/realTimeProducts/page/${page}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || '1');
  socket.emit('requestProductList', currentPage);

  if (productList) {
    productList.addEventListener("click", (event) => {
        const card = event.target.closest('.product-card');
        if (card) {
            const productId = card.getAttribute('data-id');
            window.location.href = `/product/${productId}`;
        }
    });
  }
});
