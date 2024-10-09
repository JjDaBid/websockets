document.addEventListener('DOMContentLoaded', function() {
  const cartContainer = document.querySelector('.cart-container');

  if (cartContainer) {
      cartContainer.addEventListener('click', function(event) {
          const cartCard = event.target.closest('.cart-card');
          if (!cartCard) return;      
          const productId = cartCard.dataset.id;
          const quantitySpan = cartCard.querySelector('.quantity');
          let quantity = parseInt(quantitySpan.textContent);
          const maxStock = parseInt(cartCard.dataset.stock);

          if (event.target.classList.contains('increase-btn')) {
              if (quantity < maxStock) {
                  quantity++;
                  updateCart(productId, quantity, cartCard);
              } else {
                  Swal.fire({
                      icon: 'warning',
                      title: 'Stock limitado',
                      text: `Solo puedes agregar hasta ${maxStock} unidades.`,
                  });
              }
          } else if (event.target.classList.contains('decrease-btn')) {
              if (quantity > 1) {
                  quantity--;
                  updateCart(productId, quantity, cartCard);
              }
          } else if (event.target.classList.contains('remove-btn')) {
              removeFromCart(productId, cartCard);
          }
      });
  }

  function updateCart(productId, quantity, cartCard) {
      fetch('/cart/update', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: productId, quantity: quantity })
      })
      .then(response => {
          if (!response.ok) throw new Error('Error al actualizar el carrito');          
          const quantitySpan = cartCard.querySelector('.quantity');
          const oldQuantity = parseInt(quantitySpan.textContent);
          quantitySpan.textContent = quantity;
          document.dispatchEvent(new CustomEvent('cartUpdated', { 
              detail: { action: 'add', productId: productId, quantity: quantity - oldQuantity }
          }));

          const price = parseFloat(cartCard.querySelector('.price').textContent);
          const subtotalElement = cartCard.querySelector('.subtotal');
          const subtotal = quantity * price;
          subtotalElement.innerHTML = `
            <p class="subtotal">${subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>          
          `
          subtotalElement.textContent = `${subtotal}`;

          updateCartTotal();
      })
      .catch(error => {
          console.error('Error:', error);
      });
  }

  function removeFromCart(productId, cartCard) {
      const quantity = parseInt(cartCard.querySelector('.quantity').textContent);
      fetch('/cart/remove', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: productId })
      })
      .then(response => {
          if (!response.ok) throw new Error('Error al eliminar el producto');
          cartCard.remove();
          updateCartTotal();
          document.dispatchEvent(new CustomEvent('cartUpdated', { 
              detail: { action: 'remove', productId: productId, quantity: quantity }
          }));
      })
      .catch(error => {
          console.error('Error:', error);
      });
  }

  function updateCartTotal() {
    const cartItems = document.querySelectorAll('.cart-card');
    let total = 0;
    cartItems.forEach(item => {
        const quantity = parseInt(item.querySelector('.quantity').textContent);
        const price = parseFloat(item.querySelector('.price').textContent);
        total += quantity * price;          
    });
    
    const cartTotalElement = document.querySelector('.cart-total');
    if (cartTotalElement) {
      cartTotalElement.innerHTML = `
        <span class="cart-total">${total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>      
      `
    } else {
        console.error('No se pudo encontrar el elemento .cart-total');
    }
    const totalContainer = document.querySelector('.total-container');
    if (total === 0) {
        totalContainer.style.display = 'none';
        cartContainer.innerHTML = `
            <div class="empty-cart-container">
                <img class="cart-image" src="/img/carrito-de-compras.png" alt="Carrito de Compras" />
                <p class="empty-cart-message">Tu carrito está vacío.</p>
                <button class="btn-return" onclick="window.location.href='/'"> Ir a la tienda</button>
            </div>
        `;
    } else {
        totalContainer.style.display = 'block';
    }
}

const continueBuyingButton = document.getElementById('continue-buying-button');    
    if (continueBuyingButton) {
        continueBuyingButton.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

  const payButton = document.getElementById('payButton');
  if (payButton) {
      payButton.addEventListener('click', proceedToPayment);
  }

  function proceedToPayment() {
      const cartData = getCartData();
      fetch('/api/carts', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ items: cartData })
      })
      .then(response => response.json())
      .then(data => {
          if (data.cart) {
              Toastify({
                  text: "Compra realizada exitosamente",
                  duration: 3000,
                  close: true,
                  gravity: "top",
                  position: "center",
                  backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
              }).showToast();
              payButton.disabled = true;
              clearCart();
          } else {
              throw new Error(data.error || 'Error desconocido al procesar el pago');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          Toastify({
              text: `Error al procesar el pago: ${error.message}`,
              duration: 3000,
              close: true,
              gravity: "top",
              position: "center",
              backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
          }).showToast();
          payButton.disabled = false;
      });
  } 

  function clearCart() {
    const cartItems = document.querySelectorAll('.cart-card');
    const productIds = Array.from(cartItems).map(item => item.dataset.id);
    fetch('/api/carts/removeAll', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: productIds })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Error desconocido al eliminar los productos del carrito') });
        }
        return response.json();
    })
    .then(data => {
        const cartContainer = document.querySelector('.cart-container');       

        while (cartContainer.firstChild) {
            cartContainer.removeChild(cartContainer.firstChild);
        }

        cartContainer.innerHTML = `
            <div class="empty-cart-container">
                <img class="cart-image" src="/img/carrito-de-compras.png" alt="Carrito de Compras" />
                <p class="empty-cart-message">Tu carrito está vacío.</p>
                <button class="btn-return" onclick="window.location.href='/'"> Ir a la tienda</button>
            </div>
        `;

        const cartTotalElement = document.querySelector('.cart-total');
        if (cartTotalElement) {
            cartTotalElement.textContent = '0';
        }
        const totalContainer = document.querySelector('.total-container');
        if (totalContainer) {
            totalContainer.style.display = 'none';
        }
        document.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { action: 'clear' }
        }));
    })
    .catch(error => {
        console.error('Error:', error);     
    });
}

  function getCartData() {
      const cartItems = document.querySelectorAll('.cart-card');
      return Array.from(cartItems).map(item => ({
          id: item.dataset.id,
          quantity: parseInt(item.querySelector('.quantity').textContent)
      }));
  }
});
