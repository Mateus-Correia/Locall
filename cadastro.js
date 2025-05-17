// Script para a página de cadastro de estabelecimentos

document.addEventListener('DOMContentLoaded', function() {
    // Referência ao formulário
    const form = document.getElementById('establishment-form');
    const getLocationBtn = document.getElementById('get-location');
    
    // Adicionar evento para obter localização atual
    getLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    // Preencher os campos de latitude e longitude
                    document.getElementById('latitude').value = position.coords.latitude;
                    document.getElementById('longitude').value = position.coords.longitude;
                },
                function(error) {
                    console.error('Erro ao obter localização:', error);
                    alert('Não foi possível obter sua localização. Por favor, insira as coordenadas manualmente.');
                }
            );
        } else {
            alert('Seu navegador não suporta geolocalização. Por favor, insira as coordenadas manualmente.');
        }
    });
    
    // Adicionar evento de envio do formulário
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Obter valores do formulário
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(document.getElementById('longitude').value);
        const discount = document.getElementById('discount').value;
        const message = document.getElementById('message').value;
        
        // Criar objeto com dados do estabelecimento
        const establishment = {
            name: name,
            address: address,
            position: { lat: latitude, lng: longitude },
            couponId: name.toLowerCase().replace(/\s+/g, '-'),
            discount: discount,
            message: message,
            model: 'cube'
        };
        
        // Em uma aplicação real, aqui enviaríamos os dados para um servidor
        // Para este exemplo, vamos apenas simular o sucesso e armazenar localmente
        
        // Obter estabelecimentos existentes do localStorage
        let establishments = JSON.parse(localStorage.getItem('establishments') || '[]');
        
        // Adicionar novo estabelecimento
        establishments.push(establishment);
        
        // Salvar no localStorage
        localStorage.setItem('establishments', JSON.stringify(establishments));
        
        // Mostrar mensagem de sucesso
        alert('Estabelecimento cadastrado com sucesso!');
        
        // Limpar formulário
        form.reset();
    });
});