document.addEventListener("DOMContentLoaded", function () {
  const decreaseBtn = document.getElementById("decrease-btn");
  const increaseBtn = document.getElementById("increase-btn");
  const quantityInput = document.getElementById("quantity-input");
  const addToCartBtn = document.querySelector('.add-to-cart-btn');
  const productCard = document.querySelector('.product-card'); 
  const maxStock = parseInt(productCard.getAttribute('data-stock'));

  decreaseBtn.addEventListener("click", function () {
      let currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
          quantityInput.value = currentValue - 1;
      }
  });

  increaseBtn.addEventListener("click", function () {
      let currentValue = parseInt(quantityInput.value);
      if (currentValue < maxStock) {
          quantityInput.value = currentValue + 1;
      } else {
          Swal.fire({
              icon: 'warning',
              title: 'Stock limitado',
              text: `Solo puedes agregar hasta ${maxStock} unidades.`,
          });
      }
  });

  quantityInput.addEventListener("input", function () {
      if (parseInt(quantityInput.value) < 1) {
          quantityInput.value = 1;
      }
      if (parseInt(quantityInput.value) > maxStock) {
          quantityInput.value = maxStock;
          Swal.fire({
              icon: 'warning',
              title: 'Stock limitado',
              text: `Solo puedes agregar hasta ${maxStock} unidades.`,
          });
      }
  });

  addToCartBtn.addEventListener("click", function () {
      const productId = productCard.getAttribute('data-id');
      const quantity = parseInt(quantityInput.value);      
      const title = productCard.querySelector('.product-title').innerText;
      const image = productCard.querySelector('img').src;
      const stock = productCard.querySelector('.product-stock').innerText;
      const price = productCard.querySelector('.product-price').innerText;

      fetch('/cart/add', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              id: productId,
              title: title,
              image: image,
              stock: stock,
              price: price,
              quantity: quantity
          })
      })
      .then(response => {
          if (response.ok) {
              return response.json();
          } else {
              throw new Error('Error al agregar el producto');
          }
      })
      .then(data => {
          Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Producto agregado al carrito',
          });
          // Disparar evento para actualizar el contador del carrito
          document.dispatchEvent(new CustomEvent('cartUpdated', { 
              detail: { action: 'add', productId: productId, quantity: quantity }
          }));
      })
      .catch(error => {
          console.error(error);
          Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo agregar el producto al carrito.',
          });
      });
  });







});




