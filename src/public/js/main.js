const mobileMenu = document.getElementById("mobile-menu");
const menuList = document.getElementById("menu-list");

mobileMenu.addEventListener("click", () => {
    menuList.classList.toggle("active");
});

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    const cartCount = getCartTotalQuantity();
    if (cartCount > 0) {
        cartCountElement.style.display = 'block';
        cartCountElement.textContent = cartCount;
    } else {
        cartCountElement.style.display = 'none';
    }
}

function getCartTotalQuantity() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    return cartItems.reduce((total, item) => total + item.quantity, 0);
}

function addToCart(productId, quantity) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existingItem = cartItems.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cartItems.push({ id: productId, quantity: quantity });
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCount();
}

function removeFromCart(productId, quantity) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const itemIndex = cartItems.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
        if (cartItems[itemIndex].quantity <= quantity) {
            cartItems.splice(itemIndex, 1);
        } else {
            cartItems[itemIndex].quantity -= quantity;
        }
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCount();
}

document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();
    document.addEventListener('cartUpdated', function(e) {
        if (e.detail.action === 'add') {
            addToCart(e.detail.productId, e.detail.quantity);
        } else if (e.detail.action === 'remove') {
            removeFromCart(e.detail.productId, e.detail.quantity);
        } else if (e.detail.action === 'clear') {
            localStorage.removeItem('cartItems');
            updateCartCount();
        }
    });
});

window.cartFunctions = {
    addToCart,
    removeFromCart,
    updateCartCount,
    getCartTotalQuantity
};

document.getElementById('add-product-link').addEventListener('click', function(event) {
  event.preventDefault();
  window.location.href = '/realtimeproducts';
});
