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

        // Tratamento para limpar o termo de pesquisa caso incluam "cg-"
        const termoSemPrefixo = texto.replace('cg-', '').replace('cg', '');

        const encontrados = todosImoveis.filter(imovel => {
            const idTexto = imovel.id.toString();
            const refCompleta = `cg-${imovel.id}`.toLowerCase();

            const matchTitulo = imovel.titulo.toLowerCase().includes(texto);
            const matchLocal = imovel.localizacao.toLowerCase().includes(texto);
            const matchTipo = imovel.tipo.toLowerCase().includes(texto);
            const matchRef = refCompleta.includes(texto) || idTexto === termoSemPrefixo;

            return matchTitulo || matchLocal || matchTipo || matchRef;
        });

        if (encontrados.length === 0) {
            dropdown.innerHTML = '<div style="padding: 10px; font-size: 0.85rem; color: #888; text-align: center;">Nenhum imóvel encontrado</div>';
            dropdown.style.display = "block";
            return;
        }

        dropdown.innerHTML = "";
        encontrados.forEach(imovel => {
            const imagemSrc = imovel.imagens ? imovel.imagens[0] : imovel.imagem;

            const item = document.createElement('a');
            item.href = `detalhe.html?id=${imovel.id}`;
            item.className = 'sugestao-item';
            item.innerHTML = `
                <img src="${imagemSrc}" alt="${imovel.titulo}">
                <div class="sugestao-info">
                    <h4>${imovel.titulo}</h4>
                    <p>Ref: CG-${imovel.id} • ${imovel.localizacao} • <strong style="color: var(--cor-principal);">${imovel.preco.toLocaleString('pt-PT')} €</strong></p>
                </div>
            `;
            dropdown.appendChild(item);
        });

        dropdown.style.display = "block";
    });

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

    if (!container) return;

    const imovel = todosImoveis.find(i => i.id === idImovel);

    if (!imovel) {
        container.innerHTML = '<h2 style="color: #ff6b6b; grid-column: 1/-1; text-align: center;">Imóvel não encontrado.</h2>';
        return;
    }

    const listaImagens = imovel.imagens || [imovel.imagem];

    container.innerHTML = `
        <div>
            <div class="carrossel-container">
                <button class="carrossel-btn carrossel-btn-prev" onclick="mudarImagemCarrossel(-1)">&#10094;</button>
                <img id="imagemPrincipal" src="${listaImagens[0]}" alt="${imovel.titulo}" class="carrossel-imagem-principal" onclick="abrirFullscreen()" title="Clique para ver em ecrã completo">
                <button class="carrossel-btn carrossel-btn-next" onclick="mudarImagemCarrossel(1)">&#10095;</button>
            </div>
            
            <p style="text-align: center; font-size: 0.75rem; color: #888; margin-top: 5px;">💡 Clique na foto principal para ampliar em ecrã completo</p>
            
            <div class="carrossel-miniaturas" id="containerMiniaturas">
                ${listaImagens.map((img, index) => `
                    <img src="${img}" class="miniatura-img ${index === 0 ? 'ativa' : ''}" onclick="selecionarImagem(${index})" alt="Miniatura ${index + 1}">
                `).join('')}
            </div>
        </div>

        <div>
            <span style="color: var(--cor-principal); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 2px;">${imovel.tipo} Exclusivo</span>
            <h1 style="color: #fff; font-size: 2.2rem; margin: 0.5rem 0 1rem 0; font-family: 'Cinzel', serif;">${imovel.titulo}</h1>
            
            <div class="preco-destaque-box">
                <div>
                    <span style="font-size: 0.8rem; color: #aaa; text-transform: uppercase; display: block; letter-spacing: 1px;">Valor do Investimento</span>
                    <div class="preco-valor">${imovel.preco.toLocaleString('pt-PT')} €</div>
                </div>
                <div style="text-align: right; font-size: 0.85rem; color: var(--cor-principal);">
                    Ref. CG-${imovel.id}
                </div>
            </div>

            <p style="color: #ccc; line-height: 1.8; margin-bottom: 2rem;">${imovel.descricao}</p>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; background: #1a1a1a; padding: 20px; border-radius: 6px; border: 1px solid #333; margin-bottom: 1.5rem;">
                <div>📍 <strong>Localização:</strong> ${imovel.localizacao}</div>
                <div>🛏️ <strong>Quartos:</strong> ${imovel.quartos}</div>
                <div>🚿 <strong>Casas de Banho:</strong> ${imovel.wc || 'N/D'}</div>
                <div>📐 <strong>Área Útil:</strong> ${imovel.area} m²</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <a href="tel:+351927298734" class="btn-contacto-detalhe" style="background: #1a1a1a !important; border: 1px solid var(--cor-principal);">
                    📞 Ligar Diretamente (+351 927 298 734)
                </a>
                <a href="mailto:cgp@cgimobiliaria.com?subject=Interesse no imóvel: ${imovel.titulo} (Ref: CG-${imovel.id})" class="btn-contacto-detalhe">
                    ✉️ Agendar Visita / Contactar por Email
                </a>
            </div>
        </div>
    `;

    window.imagensAtuais = listaImagens;
    window.indiceImagemAtual = 0;
}


// 5. Funções de Controlo do Full Screen e Carrossel
function abrirFullscreen() {
    const modal = document.getElementById('modalFullscreen');
    const imgModal = document.getElementById('imgModalSrc');
    const containerMiniaturasModal = document.getElementById('modalContainerMiniaturas');
    
    if (modal && imgModal && window.imagensAtuais) {
        imgModal.src = window.imagensAtuais[window.indiceImagemAtual];
        
        if (containerMiniaturasModal) {
            containerMiniaturasModal.innerHTML = window.imagensAtuais.map((img, index) => `
                <img src="${img}" class="modal-miniatura-img ${index === window.indiceImagemAtual ? 'ativa' : ''}" onclick="selecionarImagemFullscreen(${index})" alt="Miniatura ${index + 1}">
            `).join('');
        }
        
        modal.style.display = 'flex';
    }
}

function fecharFullscreen() {
    const modal = document.getElementById('modalFullscreen');
    if (modal) {
        modal.style.display = 'none';
    }
}

function mudarImagemFullscreen(direcao) {
    if (!window.imagensAtuais) return;
    
    window.indiceImagemAtual += direcao;
    if (window.indiceImagemAtual >= window.imagensAtuais.length) {
        window.indiceImagemAtual = 0;
    } else if (window.indiceImagemAtual < 0) {
        window.indiceImagemAtual = window.imagensAtuais.length - 1;
    }
    
    atualizarVisualizacaoCarrossel();
    
    const imgModal = document.getElementById('imgModalSrc');
    if (imgModal) {
        imgModal.src = window.imagensAtuais[window.indiceImagemAtual];
    }
    atualizarEstadoMiniaturasFullscreen();
}

function selecionarImagemFullscreen(index) {
    window.indiceImagemAtual = index;
    atualizarVisualizacaoCarrossel();
    
    const imgModal = document.getElementById('imgModalSrc');
    if (imgModal) {
        imgModal.src = window.imagensAtuais[window.indiceImagemAtual];
    }
    atualizarEstadoMiniaturasFullscreen();
}

function atualizarEstadoMiniaturasFullscreen() {
    const miniaturasModal = document.querySelectorAll('.modal-miniatura-img');
    miniaturasModal.forEach((min, idx) => {
        if (idx === window.indiceImagemAtual) {
            min.classList.add('ativa');
        } else {
            min.classList.remove('ativa');
        }
    });
}

function mudarImagemCarrossel(direcao) {
    if (!window.imagensAtuais) return;
    window.indiceImagemAtual += direcao;
    if (window.indiceImagemAtual >= window.imagensAtuais.length) window.indiceImagemAtual = 0;
    else if (window.indiceImagemAtual < 0) window.indiceImagemAtual = window.imagensAtuais.length - 1;
    atualizarVisualizacaoCarrossel();
}

function selecionarImagem(index) {
    window.indiceImagemAtual = index;
    atualizarVisualizacaoCarrossel();
}

function atualizarVisualizacaoCarrossel() {
    const imgPrincipal = document.getElementById('imagemPrincipal');
    if (imgPrincipal) imgPrincipal.src = window.imagensAtuais[window.indiceImagemAtual];
    
    const miniaturas = document.querySelectorAll('.miniatura-img');
    miniaturas.forEach((min, idx) => {
        if (idx === window.indiceImagemAtual) min.classList.add('ativa');
        else min.classList.remove('ativa');
    });
}


// 6. Funções Auxiliares (Destaques, Catálogo e Filtros)
function carregarDestaques() {
    const grid = document.getElementById('gridDestaques');
    if (!grid) return;
    
    const destaques = todosImoveis.filter(i => i.destaque === true);
    
    if (destaques.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">Sem destaques de momento.</p>';
        return;
    }

    grid.innerHTML = destaques.map(imovel => gerarHtmlCardImovel(imovel)).join('');
}

function exibirImoveis(lista) {
    const container = document.getElementById('gridImoveis');
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = '<h3 style="color: #aaa; text-align: center; grid-column: 1/-1;">Nenhum imóvel encontrado.</h3>';
        return;
    }

    container.innerHTML = lista.map(imovel => gerarHtmlCardImovel(imovel)).join('');
}

// Função unificada para gerar o HTML do Card com a imagem no topo
function gerarHtmlCardImovel(imovel) {
    const fotoCapa = (imovel.imagens && imovel.imagens.length > 0) ? imovel.imagens[0] : imovel.imagem;

    return `
        <div class="card-imovel">
            <div class="card-imagem-wrapper" style="width: 100%; height: 220px; overflow: hidden; border-radius: 6px 6px 0 0;">
                <img src="${fotoCapa}" alt="${imovel.titulo}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
            </div>

            <div style="padding: 1.5rem;">
                <span style="color: var(--cor-principal); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 0.5rem;">
                    ${imovel.tipo} Exclusivo
                </span>
                
                <h3 style="color: #fff; font-size: 1.4rem; font-family: 'Cinzel', serif; margin-bottom: 0.5rem;">
                    ${imovel.titulo}
                </h3>
                
                <div style="color: var(--cor-principal); font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
                    ${imovel.preco.toLocaleString('pt-PT')} €
                </div>

                <p style="color: #aaa; font-size: 0.85rem; line-height: 1.5; margin-bottom: 1.2rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    ${imovel.descricao}
                </p>

                <!-- COLA ESTA PARTE AQUI DENTRO DO CARD -->
                <div style="display: flex; flex-wrap: wrap; gap: 0.8rem; font-size: 0.8rem; color: #ccc; margin-bottom: 1.2rem; border-top: 1px solid #222; padding-top: 0.8rem;">
                    <span>📍 ${imovel.localizacao}</span>
                    <span>🛏️ ${imovel.quartos} Quartos</span>
                    <span>📐 ${imovel.area} m²</span>
                </div>

                <a href="detalhe.html?id=${imovel.id}" class="btn-detalhes">
                    VER CARACTERÍSTICAS & DETALHES
                </a>
            </div>
        </div>
    `;
}

function filtrarImoveis() {
    const texto = document.getElementById('filtroTexto') ? document.getElementById('filtroTexto').value.toLowerCase().trim() : "";
    const tipo = document.getElementById('filtroTipo') ? document.getElementById('filtroTipo').value : "";
    const local = document.getElementById('filtroLocal') ? document.getElementById('filtroLocal').value : "";
    const precoMax = document.getElementById('filtroPreco') ? parseFloat(document.getElementById('filtroPreco').value) || Infinity : Infinity;

    const termoSemPrefixo = texto.replace('cg-', '').replace('cg', '');

    const filtrados = todosImoveis.filter(imovel => {
        const idTexto = imovel.id.toString();
        const refCompleta = `cg-${imovel.id}`.toLowerCase();

        const matchTexto = texto === "" || 
                           imovel.titulo.toLowerCase().includes(texto) || 
                           imovel.localizacao.toLowerCase().includes(texto) ||
                           refCompleta.includes(texto) || 
                           idTexto === termoSemPrefixo;

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

function destacarMenuAtivo() {
    const caminhoAtual = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("nav ul li a").forEach(link => {
        link.classList.remove("active");
        if (caminhoAtual === link.getAttribute("href")) {
            link.classList.add("active");
        }
    });
}

// Iniciar Aplicação
inicializarDados();