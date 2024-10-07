const socket = io({
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('requestProductList');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server', reason);
  if (reason === 'io server disconnect') {
    // the disconnection was initiated by the server, you need to reconnect manually
    socket.connect();
  }
});
socket.on('connect_error', (error) => {
  console.log('Connection error:', error);
});

const productList = document.getElementById('product-list');
const productForm = document.getElementById('product-form');
const paginationSection = document.querySelector('.pagination-section');

function deleteProduct(id) {
    if (!id) {
        console.error('ID de producto no válido');
        showToast("Error: ID de producto no válido", "error");
        return;
    }

    fetch(`/deleteProduct/${id}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        if (result.success) {
            socket.emit('requestProductList');
            showToast("Producto eliminado exitosamente", "success");
        } else {
            throw new Error(result.error || 'Error desconocido al eliminar el producto');
        }
    })
    .catch(error => {
        console.error('Error al eliminar el producto:', error);
        showToast("Error al eliminar el producto: " + error.message, "error");
    });
}

productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(productForm);
    const data = Object.fromEntries(formData);
    const productId = data.id;
    
    const url = productId ? `/api/products/${productId}` : '/api/products';
    const method = productId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(() => {
        socket.emit('requestProductList');
        showToast(productId ? "Producto actualizado" : "Producto agregado", "success");
        productForm.reset();
        document.getElementById('product-id').value = '';
    })
    .catch(error => {
        console.error('Error al guardar el producto:', error);
        showToast("Error al guardar el producto", "error");
    });
});

function loadProductForEdit(productId) {
    if (!productId) {
        console.error('ID de producto no válido');
        return;
    }
    fetch(`/api/products/${productId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Producto no encontrado');
            }
            return response.json();
        })
        .then(product => {
            document.getElementById('product-id').value = product._id;
            document.getElementById('product-name').value = product.title;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-quantity').value = product.stock;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-image').value = product.image;
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        })
        .catch(error => {
            console.error('Error al cargar el producto para editar:', error);
            showToast("Error al cargar el producto: " + error.message, "error");
        });
}

socket.on('productListUpdate', (updatedProducts) => {
    updateProductList(updatedProducts.docs);
    updatePaginationControls(updatedProducts);
});

function updateProductList(products) {
    if (productList) {
        productList.innerHTML = products.map(product => `
            <div class="product-card">
                <figure class="figure">
                    <span class="category-badge">${product.category}</span>
                    <img src="${product.image}" alt="Imagen de ${product.title}" class="product-image"/>
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
                <div class="product-actions">
                    <button onclick="loadProductForEdit('${product._id}')" class="button-link">Editar</button>
                    <button onclick="deleteProduct('${product._id}')">Eliminar</button>
                    <a href="/product/${product._id}" class="button-link">Ver</a>
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
    window.history.pushState({}, '', `/realtimeproducts/page/${page}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || '1');
  socket.emit('requestProductList', currentPage);
});

function showToast(message, type) {
  Toastify({
      text: message,
      duration: 3000,
      backgroundColor: type === "error" 
          ? "linear-gradient(to right, #ff5f6d, #ffc371)"
          : "linear-gradient(to right, #56ab2f, #a8e063)",
      close: true
  }).showToast();
}
