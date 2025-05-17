// Configuration
const CONFIG = {
    TRIGGER_DISTANCE: 50, // meters
    DEFAULT_ZOOM: 15, // Zoom ajustado para melhor visualização da cidade
    DEFAULT_TILT: 45,
    DEFAULT_HEADING: 0,
    LAGES_CENTER: { lat: -27.815600, lng: -50.326500 } // Centro de Lages
};

// Store coupon locations and their details
const DEFAULT_COUPON_LOCATIONS = [
    {
        position: { lat: -27.814500, lng: -50.325800 }, // Tanque coordinates
        couponId: 'tanque',
        discount: '20% OFF',
        message: 'Você desbloqueou um cupom especial do Tanque com 20% de desconto!',
        model: 'cube',
        name: 'Tanque'
    },
    {
        position: { lat: -27.816700, lng: -50.326900 }, // Catedral coordinates
        couponId: 'catedral',
        discount: '15% OFF',
        message: 'Parabéns! Você ganhou 15% de desconto na região da Catedral!',
        model: 'cube',
        name: 'Catedral'
    }
];

// Combinar locais padrão com estabelecimentos cadastrados pelo usuário
function getCombinedLocations() {
    // Obter estabelecimentos cadastrados do localStorage
    const userEstablishments = JSON.parse(localStorage.getItem('establishments') || '[]');
    
    // Combinar com locais padrão
    return [...DEFAULT_COUPON_LOCATIONS, ...userEstablishments];
}

// Variável global para armazenar todos os locais com cupons
let COUPON_LOCATIONS = [];

// Global variables
let map;
let userMarker;
let threejsOverlay;
let scene, renderer;
let userPositionInitialized = false;
let unlockedCoupons = new Set(JSON.parse(localStorage.getItem('unlockedCoupons') || '[]'));

// Initialize Google Map
function initMap() {
    // Carregar todos os locais com cupons (padrão + cadastrados pelo usuário)
    COUPON_LOCATIONS = getCombinedLocations();
    
    // Create the map with Leaflet
    map = L.map('map', {
        zoom: CONFIG.DEFAULT_ZOOM,
        zoomControl: true,
        zoomControlPosition: 'bottomright'
    }).setView([CONFIG.LAGES_CENTER.lat, CONFIG.LAGES_CENTER.lng], CONFIG.DEFAULT_ZOOM); // Inicializar no centro de Lages

    // Adicionar camada de mapa do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Start tracking user location
    initGeolocation();
    
    // Initialize 3D overlay (será adaptado para Leaflet)
    initWebGLOverlay();
    
    // Atualizar a lista de locais na sidebar
    updateLocationsList();
}

// Initialize Three.js WebGL overlay
function initWebGLOverlay() {
    // Criar marcadores Leaflet para cada localização de cupom
    COUPON_LOCATIONS.forEach(location => {
        // Criar um ícone personalizado para representar o cupom
        const couponIcon = L.divIcon({
            className: 'coupon-marker',
            html: '<div style="background-color: #FF5722; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        // Adicionar marcador ao mapa
        const marker = L.marker([location.position.lat, location.position.lng], {
            icon: couponIcon
        }).addTo(map);
        
        // Adicionar popup com informações do cupom
        marker.bindPopup(`<b>${location.discount}</b><br>${location.message}`);
    });
    
    // Nota: A implementação 3D completa com Three.js no Leaflet requer uma abordagem diferente
    // Esta é uma implementação simplificada usando marcadores Leaflet
    // Para uma implementação 3D completa, seria necessário usar bibliotecas como Leaflet.glify ou uma camada personalizada
}

// Function to check proximity between user and coupon locations
function checkProximity(userLatLng) {
    let nearestLocation = null;
    let nearestDistance = Infinity;
    let isNearAnyLocation = false;
    
    COUPON_LOCATIONS.forEach(location => {
        const locationLatLng = L.latLng(location.position.lat, location.position.lng);
        const userLeafletLatLng = L.latLng(userLatLng.lat, userLatLng.lng);

        // Calculate distance between user and coupon location using Leaflet
        const distance = userLeafletLatLng.distanceTo(locationLatLng);
        
        // Verificar se está próximo (dentro de 100 metros)
        if (distance <= 100 && distance > CONFIG.TRIGGER_DISTANCE) {
            isNearAnyLocation = true;
            
            // Atualizar o local mais próximo
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestLocation = location;
            }
        }

        // Check if user is within trigger distance to unlock coupon
        if (!unlockedCoupons.has(location.couponId) && distance <= CONFIG.TRIGGER_DISTANCE) {
            unlockCoupon(location);
        }
    });
    
    // Mostrar ou esconder o popup de proximidade
    const proximityPopup = document.getElementById('proximity-popup');
    
    if (isNearAnyLocation && !proximityPopup.classList.contains('showing')) {
        proximityPopup.classList.remove('hidden');
        proximityPopup.classList.add('showing');
        
        // Esconder o popup após 5 segundos
        setTimeout(() => {
            proximityPopup.classList.add('hidden');
            proximityPopup.classList.remove('showing');
        }, 5000);
    } else if (!isNearAnyLocation) {
        proximityPopup.classList.add('hidden');
        proximityPopup.classList.remove('showing');
    }
}

// Initialize geolocation tracking
function initGeolocation() {
    if (!navigator.geolocation) {
        console.error('Geolocation is not supported by your browser');
        return;
    }

    // Create user marker with Leaflet
    userMarker = L.circleMarker([0, 0], {
        radius: 8,
        fillColor: '#4285F4',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
    }).addTo(map);

    // Watch user position
    navigator.geolocation.watchPosition(
        (position) => updateUserPosition(position),
        (error) => console.error('Error getting location:', error),
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Update user position and check for nearby coupons
function updateUserPosition(position) {
    const userLatLng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };

    // Update user marker position
    userMarker.setLatLng([userLatLng.lat, userLatLng.lng]);

    // Center map on user if this is the first position update
    if (!userPositionInitialized) {
        map.setView([userLatLng.lat, userLatLng.lng], CONFIG.DEFAULT_ZOOM);
        userPositionInitialized = true;
    }

    // Check if user is near any coupon locations
    checkProximity(userLatLng);
}

// Show coupon popup
function showCoupon(location) {
    // Update popup content
    document.getElementById('coupon-message').textContent = location.message;

    // Show popup
    document.getElementById('coupon-popup').classList.remove('hidden');
    
    // Adicionar ao conjunto de cupons desbloqueados
    unlockedCoupons.add(location.couponId);
    
    // Salvar no localStorage
    localStorage.setItem('unlockedCoupons', JSON.stringify([...unlockedCoupons]));
    
    // Reproduzir som de notificação (opcional)
    playNotificationSound();
}

// Função para reproduzir som de notificação
function playNotificationSound() {
    // Criar elemento de áudio
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Erro ao reproduzir som:', e));
}

// Função para atualizar a lista de locais na sidebar
function updateLocationsList() {
    const locationsList = document.querySelector('.locations-list');
    locationsList.innerHTML = '';
    
    // Adicionar cada local à lista
    COUPON_LOCATIONS.forEach(location => {
        const locationItem = document.createElement('div');
        locationItem.className = 'location-item';
        
        // Verificar se o cupom já foi desbloqueado
        const isUnlocked = unlockedCoupons.has(location.couponId);
        
        // Adicionar classe se o cupom estiver desbloqueado
        if (isUnlocked) {
            locationItem.classList.add('unlocked');
        }
        
        locationItem.innerHTML = `
            <h3>${location.name}</h3>
            <p>${location.discount}</p>
            ${isUnlocked ? '<span class="unlocked-badge">✓ Desbloqueado</span>' : ''}
        `;
        
        // Adicionar evento de clique para centralizar o mapa neste local
        locationItem.addEventListener('click', () => {
            map.setView([location.position.lat, location.position.lng], CONFIG.DEFAULT_ZOOM);
        });
        
        locationsList.appendChild(locationItem);
    });
}

// Dismiss coupon popup
function dismissCoupon() {
    document.getElementById('coupon-popup').classList.add('hidden');
}

// Função para desbloquear um cupom
function unlockCoupon(location) {
    // Mostrar o popup do cupom
    showCoupon(location);
    
    // Marcar o cupom como desbloqueado
    unlockedCoupons.add(location.couponId);
    
    // Salvar no localStorage
    localStorage.setItem('unlockedCoupons', JSON.stringify([...unlockedCoupons]));
}

// Inicializar o mapa quando a página carregar
document.addEventListener('DOMContentLoaded', initMap);