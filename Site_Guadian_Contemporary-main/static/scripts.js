/* static/scripts.js - Versão com Live Search Flutuante e Detalhes */

let todosImoveis = [];

// 1. Carregar o Header Dinamicamente
fetch('header.html')
    .then(response => response.text())
    .then(data => {
        const headerContainer = document.getElementById('site-header');
        if (headerContainer) {
            headerContainer.innerHTML = data;
            destacarMenuAtivo();
            configurarPesquisaTempoReal();
        }
    })
    .catch(error => console.error('Erro ao carregar o header:', error));


// 2. Inicializar Dados
async function inicializarDados() {
    try {
        const response = await fetch('static/imoveis.json');
        todosImoveis = await response.json();
        
        if (document.getElementById('gridDestaques')) {
            carregarDestaques();
        }

        if (document.getElementById('gridImoveis')) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('tipo')) document.getElementById('filtroTipo').value = urlParams.get('tipo');
            if (urlParams.get('local')) document.getElementById('filtroLocal').value = urlParams.get('local');
            if (urlParams.get('q')) document.getElementById('filtroTexto').value = urlParams.get('q');
            filtrarImoveis();
        }

        if (document.getElementById('detalheImovel')) {
            carregarDetalhesImovel();
        }
    } catch (error) {
        console.error('Erro ao carregar o JSON:', error);
    }
}


// 3. Pesquisa em Tempo Real com Sugestões Flutuantes (Dropdown)
function configurarPesquisaTempoReal() {
    const inputTexto = document.getElementById('filtroTexto');
    const dropdown = document.getElementById('sugestoesPesquisa');

    if (!inputTexto || !dropdown) return;

    inputTexto.addEventListener('input', () => {
        const texto = inputTexto.value.toLowerCase().trim();
        
        // Se estiver na página de catálogo, filtra também a grelha principal
        if (document.getElementById('gridImoveis')) {
            filtrarImoveis();
        }

        if (texto === "") {
            dropdown.style.display = "none";
            dropdown.innerHTML = "";
            return;
        }

        const encontrados = todosImoveis.filter(i => 
            i.titulo.toLowerCase().includes(texto) || 
            i.localizacao.toLowerCase().includes(texto) ||
            i.tipo.toLowerCase().includes(texto)
        );

        if (encontrados.length === 0) {
            dropdown.innerHTML = '<div style="padding: 10px; font-size: 0.85rem; color: #888; text-align: center;">Nenhum imóvel encontrado</div>';
            dropdown.style.display = "block";
            return;
        }

        dropdown.innerHTML = "";
        encontrados.forEach(imovel => {
            const item = document.createElement('a');
            item.href = `detalhe.html?id=${imovel.id}`;
            item.className = 'sugestao-item';
            item.innerHTML = `
                <img src="${imovel.imagem}" alt="${imovel.titulo}">
                <div class="sugestao-info">
                    <h4>${imovel.titulo}</h4>
                    <p>${imovel.localizacao} - ${imovel.preco.toLocaleString('pt-PT')} €</p>
                </div>
            `;
            dropdown.appendChild(item);
        });

        dropdown.style.display = "block";
    });

    // Fecha o dropdown se o utilizador clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container-wrapper')) {
            dropdown.style.display = "none";
        }
    });
}


// 4. Carregar Página de Detalhes Individuais
function carregarDetalhesImovel() {
    const urlParams = new URLSearchParams(window.location.search);
    const idImovel = parseInt(urlParams.get('id'));
    const container = document.getElementById('detalheImovel');

    const imovel = todosImoveis.find(i => i.id === idImovel);

    if (!imovel) {
        container.innerHTML = '<h2 style="color: #ff6b6b; grid-column: 1/-1; text-align: center;">Imóvel não encontrado.</h2>';
        return;
    }

    container.innerHTML = `
        <div>
            <img src="${imovel.imagem}" alt="${imovel.titulo}" style="width: 100%; height: 400px; object-fit: cover; border-radius: 8px; border: 2px solid var(--dourado);">
        </div>
        <div>
            <span style="color: var(--dourado); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 2px;">${imovel.tipo} Exclusivo</span>
            <h1 style="color: #fff; font-size: 2.2rem; margin: 0.5rem 0 1rem 0; font-family: 'Cinzel', serif;">${imovel.titulo}</h1>
            <div style="font-size: 1.8rem; color: var(--dourado); font-weight: bold; margin-bottom: 1.5rem;">${imovel.preco.toLocaleString('pt-PT')} €</div>
            <p style="color: #ccc; line-height: 1.8; margin-bottom: 2rem;">${imovel.descricao}</p>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; background: #1a1a1a; padding: 20px; border-radius: 6px; border: 1px solid #333; margin-bottom: 2rem;">
                <div>📍 <strong>Localização:</strong> ${imovel.localizacao}</div>
                <div>🛏️ <strong>Quartos:</strong> ${imovel.quartos}</div>
                <div>🚿 <strong>Casas de Banho:</strong> ${imovel.wc || 'N/D'}</div>
                <div>📐 <strong>Área Útil:</strong> ${imovel.area} m²</div>
            </div>

            <a href="mailto:contemporaryguardian@gmail.com?subject=Interesse no imóvel: ${imovel.titulo}" class="btn-detalhes" style="padding: 15px; font-size: 1rem; text-align: center; background: var(--dourado); color: #111; text-decoration: none; border-radius: 4px; display: block; font-weight: bold;">Agendar Visita / Contactar por Email</a>
        </div>
    `;
}


// 5. Funções Auxiliares (Destaques, Catálogo e Filtros)
function carregarDestaques() {
    const grid = document.getElementById('gridDestaques');
    if (!grid) return;
    grid.innerHTML = '';
    todosImoveis.filter(i => i.destaque === true).forEach(imovel => {
        grid.appendChild(criarCardImovel(imovel));
    });
}

function exibirImoveis(lista) {
    const grid = document.getElementById('gridImoveis');
    if (!grid) return;
    grid.innerHTML = '';
    if(lista.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">Nenhum imóvel encontrado.</p>';
        return;
    }
    lista.forEach(imovel => {
        grid.appendChild(criarCardImovel(imovel));
    });
}

function filtrarImoveis() {
    const texto = document.getElementById('filtroTexto') ? document.getElementById('filtroTexto').value.toLowerCase().trim() : "";
    const tipo = document.getElementById('filtroTipo') ? document.getElementById('filtroTipo').value : "";
    const local = document.getElementById('filtroLocal') ? document.getElementById('filtroLocal').value : "";
    const precoMax = document.getElementById('filtroPreco') ? parseFloat(document.getElementById('filtroPreco').value) || Infinity : Infinity;

    const filtrados = todosImoveis.filter(imovel => {
        const matchTexto = texto === "" || imovel.titulo.toLowerCase().includes(texto) || imovel.localizacao.toLowerCase().includes(texto);
        const matchTipo = tipo === "" || imovel.tipo === tipo;
        const matchLocal = local === "" || imovel.localizacao.includes(local);
        const matchPreco = imovel.preco <= precoMax;
        return matchTexto && matchTipo && matchLocal && matchPreco;
    });

    exibirImoveis(filtrados);
}

function limparFiltros() {
    if (document.getElementById('filtroTexto')) document.getElementById('filtroTexto').value = "";
    if (document.getElementById('filtroTipo')) document.getElementById('filtroTipo').value = "";
    if (document.getElementById('filtroLocal')) document.getElementById('filtroLocal').value = "";
    if (document.getElementById('filtroPreco')) document.getElementById('filtroPreco').value = "";
    window.history.replaceState({}, document.title, window.location.pathname);
    exibirImoveis(todosImoveis);
}

function criarCardImovel(imovel) {
    const card = document.createElement('div');
    card.className = 'card-imovel';
    card.innerHTML = `
        <img src="${imovel.imagem}" alt="${imovel.titulo}">
        <div class="card-body">
            <h3>${imovel.titulo}</h3>
            <div class="preco">${imovel.preco.toLocaleString('pt-PT')} €</div>
            <p>${imovel.descricao}</p>
            <div class="card-footer">
                <span>📍 ${imovel.localizacao}</span>
                <span>🛏️ ${imovel.quartos} Quartos</span>
                <span>📐 ${imovel.area} m²</span>
            </div>
            <a href="detalhe.html?id=${imovel.id}" class="btn-detalhes">Ver Características & Detalhes</a>
        </div>
    `;
    return card;
}

function destacarMenuAtivo() {
    const caminhoAtual = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("nav ul li a").forEach(link => {
        link.classList.remove("active");
        if (caminhoAtual === link.getAttribute("href")) {
            link.classList.add("active");
        }
    });
}

// Iniciar
inicializarDados();