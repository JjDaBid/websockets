const socket = io();
const productList = document.getElementById('product-list');

function deleteProduct(id) {
    fetch('/deleteProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    }).then(response => response.json())
      .then(() => socket.emit('requestProductList'));
}

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