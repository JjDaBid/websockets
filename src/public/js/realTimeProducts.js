const socket = io();
const productList = document.getElementById('product-list');
const productForm = document.getElementById('product-form');

function deleteProduct(id) {
    fetch('/deleteProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    }).then(response => response.json())
      .then(() => socket.emit('requestProductList'));
      Toastify({
        text: "Producto Eliminado exitosamente",
        duration: 3000,
        backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        close: true
      }).showToast().catch(error => {
          
        Toastify({
            text: "Error al eliminar el producto",
            duration: 3000,
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
            close: true
        }).showToast();
    });
}

productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(productForm);
    const data = Object.fromEntries(formData);
    const url = data.id ? '/updateProduct' : '/addProduct';
    

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json())
      .then(() => {
          socket.emit('requestProductList');
          productForm.reset();
          document.getElementById('product-id').value = '';          

          Toastify({
            text: "Producto guardado exitosamente",
            duration: 3000,
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
            close: true
          }).showToast();
      })
      .catch(error => {
          
          Toastify({
              text: "Error al guardar el producto",
              duration: 3000,
              backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
              close: true
          }).showToast();
      });
});

socket.on('productListUpdate', (updatedProducts) => {
    productList.innerHTML = updatedProducts.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="Imagen de ${product.name}" class="product-image">
            <h2>${product.name}</h2>
            <p><strong>ID:</strong> ${product.id}</p>
            <p><strong>Descripción:</strong> ${product.description}</p>
            <p><strong>Categoría:</strong> ${product.category}</p>
            <p><strong>Cantidad:</strong> ${product.quantity}</p>
            <div class="product-actions">
                <a href="/realtimeproducts?id=${product.id}" class="button-link">Editar</a>
                <button onclick="deleteProduct(${product.id})">Eliminar</button>
            </div>
        </div>
    `).join('');
});

document.addEventListener('DOMContentLoaded', () => {
    socket.emit('requestProductList');
});
