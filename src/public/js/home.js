const socket = io();

function updatePaginationControls(products) {
  if (!paginationSection) return;

  const currentPath = window.location.pathname;
  const category = currentPath.split('/')[1] !== 'page' ? currentPath.split('/')[1] : '';
  
  const basePath = category ? `/${category}/page/` : '/page/';

  paginationSection.innerHTML = `
      ${products.hasPrevPage ? `<a id="prev-button" href="${basePath}${products.prevPage}" data-page="${products.prevPage}">Anterior</a>` : ''}
      <input type="number" id="page-input" value="${products.page}" min="1" max="${products.totalPages}" style="width: 50px; text-align: center;" />
      ${products.hasNextPage ? `<a id="next-button" href="${basePath}${products.nextPage}" data-page="${products.nextPage}">Siguiente</a>` : ''}
  `;
  attachPaginationEventListeners(products.totalPages, category);
}

function attachPaginationEventListeners(totalPages, category) {
  const prevButton = document.getElementById("prev-button");
  const nextButton = document.getElementById("next-button");
  const pageInput = document.getElementById("page-input");

  if (prevButton) {
    prevButton.addEventListener("click", (e) => handlePaginationClick(e, category));
  }

  if (nextButton) {
    nextButton.addEventListener("click", (e) => handlePaginationClick(e, category));
  }

  if (pageInput) {
    pageInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        navigateToPage(pageInput.value, totalPages, category);
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

function navigateToPage(inputPage, totalPages, category) {
  let page = parseInt(inputPage);
  if (isNaN(page) || page < 1) {
    page = 1;
  } else if (page > totalPages) {
    page = totalPages;
  }
  
  const basePath = category ? `/${category}/page/` : '/page/';
  const newUrl = `${basePath}${page}`;
  
  window.location.href = newUrl;
}

function handlePaginationClick(e, category) {
  e.preventDefault();
  const page = this.getAttribute('data-page');
  if (page) {
    navigateToPage(page, null, category);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/');
  const category = pathParts[1] !== 'page' ? pathParts[1] : '';
  const currentPage = parseInt(pathParts[pathParts.length - 1]) || 1;

  const productList = document.getElementById('product-list');

  socket.emit('requestProductList', { page: currentPage, category });

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
